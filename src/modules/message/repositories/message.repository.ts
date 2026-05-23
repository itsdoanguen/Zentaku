/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/BaseRepository';
import type { ChannelParticipant } from '../../../entities/ChannelParticipant.entity';
import type { Message as SQLMessage } from '../../../entities/Message.entity';
import type { IMessageRepository } from '../types/message.types';
import { ChatMessageModel } from './message.schema';

export class MessageRepository extends BaseRepository<SQLMessage> implements IMessageRepository {
  constructor(
    repository: Repository<SQLMessage>,
    private readonly participantRepository: Repository<ChannelParticipant>
  ) {
    super(repository);
  }

  async appendMessage(data: {
    channelId: bigint;
    senderId: bigint;
    replyToId?: bigint | null;
    content: string;
    attachments?: Record<string, unknown>[] | null;
  }): Promise<SQLMessage> {
    // Create SQL Message record
    const sqlMessage = this.repository.create({
      channelId: data.channelId,
      senderId: data.senderId,
      replyToId: data.replyToId || null,
      isSystemMessage: false,
    });
    const savedSqlMessage = await this.repository.save(sqlMessage);

    //Create Message in NoSQL DB
    const mongoMessage = new ChatMessageModel({
      _id: String(savedSqlMessage.id),
      channelId: String(data.channelId),
      senderId: String(data.senderId),
      content: data.content,
      replyToId: data.replyToId ? String(data.replyToId) : null,
      attachments: data.attachments || [],
      createdAt: savedSqlMessage.createdAt || new Date(),
      editedAt: null,
    });
    await mongoMessage.save();

    return savedSqlMessage;
  }

  async fetchHistory(
    channelId: bigint,
    options: {
      cursorDate?: Date;
      cursorId?: string;
      limit: number;
      direction: 'backward' | 'forward';
      sortOrder: 'asc' | 'desc';
    }
  ): Promise<any[]> {
    const query: any = { channelId: String(channelId) };

    if (options.cursorDate && options.cursorId) {
      // backward: older messages (less than cursor)
      // forward: newer messages (greater than cursor)
      const op = options.direction === 'backward' ? '$lt' : '$gt';
      const idOp = options.direction === 'backward' ? '$lt' : '$gt';

      query.$or = [
        { createdAt: { [op]: options.cursorDate } },
        { createdAt: options.cursorDate, _id: { [idOp]: options.cursorId } },
      ];
    }

    const sortDir = options.sortOrder === 'desc' ? -1 : 1;

    // Fetch limit + 1 to determine hasMore
    const docs = await ChatMessageModel.find(query)
      .sort({ createdAt: sortDir, _id: sortDir })
      .limit(options.limit + 1)
      .lean();

    return docs;
  }

  async updateReadCursor(
    channelId: bigint,
    userId: bigint,
    lastReadMessageId: bigint
  ): Promise<ChannelParticipant> {
    let participant = await this.participantRepository.findOne({
      where: {
        channelId: channelId as any,
        userId: userId as any,
      },
    });

    if (!participant) {
      participant = this.participantRepository.create({
        channelId,
        userId,
        isMuted: false,
      });
    }

    participant.lastReadAt = new Date();
    participant.lastReadMessageId = lastReadMessageId;

    return this.participantRepository.save(participant);
  }
}
