import { BaseService } from '../../../core/base/BaseService';
import { NotFoundError, ValidationError } from '../../../shared/utils/error';
import type { IChannelRepository } from '../../channel/types/channel.types';
import type {
  ICommunityMemberRepository,
  ICommunityRepository,
} from '../../community/types/community.types';
import type {
  IMessageRepository,
  IMessageService,
  MessageHistoryQuery,
  MessageResponseDto,
  PaginatedMessagesDto,
  SendMessageDto,
} from '../types/message.types';

export class MessageService extends BaseService implements IMessageService {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly channelRepository: IChannelRepository,
    private readonly communityRepository: ICommunityRepository,
    private readonly communityMemberRepository: ICommunityMemberRepository
  ) {
    super();
  }

  private async authorizeChannelAccess(channelId: bigint, userId: bigint): Promise<void> {
    const channel = await this.channelRepository.findChannelById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    if (channel.communityId) {
      // It is a community channel
      const community = await this.communityRepository.findCommunityById(channel.communityId);
      if (!community) {
        throw new NotFoundError('Community not found');
      }

      const member = await this.communityMemberRepository.findMember(channel.communityId, userId);

      if (channel.isPrivate) {
        if (!member) {
          throw new ValidationError('Access denied to this private channel');
        }
      } else {
        // Public channel
        if (!community.isPublic && !member) {
          throw new ValidationError('Access denied to this private community');
        }
      }
    } else {
      // It is a private DM channel
      const isPart = await this.channelRepository.isParticipant(channelId, userId);
      if (!isPart) {
        throw new ValidationError('Access denied to this direct message channel');
      }
    }
  }

  async sendMessage(
    channelId: bigint,
    userId: bigint,
    data: SendMessageDto
  ): Promise<MessageResponseDto> {
    await this.authorizeChannelAccess(channelId, userId);

    this._validateString(data.content, 'Message content', { minLength: 1, maxLength: 4000 });

    const replyToIdBigInt = data.replyToId ? BigInt(data.replyToId) : null;

    const savedMessage = await this.messageRepository.appendMessage({
      channelId,
      senderId: userId,
      replyToId: replyToIdBigInt,
      content: data.content,
      attachments: data.attachments || [],
    });

    return {
      id: String(savedMessage.id),
      channelId: String(channelId),
      senderId: String(userId),
      content: data.content,
      replyToId: data.replyToId ? String(data.replyToId) : null,
      attachments: data.attachments || [],
      createdAt: savedMessage.createdAt ? savedMessage.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  async getMessageHistory(
    channelId: bigint,
    userId: bigint,
    query: MessageHistoryQuery
  ): Promise<PaginatedMessagesDto> {
    await this.authorizeChannelAccess(channelId, userId);

    let cursorDate: Date | undefined;
    let cursorId: string | undefined;

    if (query.cursor) {
      try {
        const decoded = Buffer.from(query.cursor, 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        if (parsed.createdAt && parsed.id) {
          cursorDate = new Date(parsed.createdAt);
          cursorId = parsed.id;
        }
      } catch {
        throw new ValidationError('Invalid cursor parameter');
      }
    }

    const limit = query.limit || 50;
    const direction = query.direction || 'backward';
    const sortOrder = query.sortOrder || 'desc';

    const docs = await this.messageRepository.fetchHistory(channelId, {
      cursorDate,
      cursorId,
      limit,
      direction,
      sortOrder,
    });

    const hasMore = docs.length > limit;
    if (hasMore) {
      docs.pop(); // Remove the extra record
    }

    const items: MessageResponseDto[] = docs.map((doc) => ({
      id: String(doc._id),
      channelId: String(doc.channelId),
      senderId: String(doc.senderId),
      content: doc.content,
      replyToId: doc.replyToId ? String(doc.replyToId) : null,
      attachments: doc.attachments || [],
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
    }));

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1]!;
      const cursorObj = {
        createdAt: lastItem.createdAt,
        id: lastItem.id,
      };
      nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');
    }

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  async updateReadCursor(
    channelId: bigint,
    userId: bigint,
    lastReadMessageId: bigint
  ): Promise<{
    channelId: string;
    userId: string;
    lastReadMessageId: string;
    updatedAt: string;
  }> {
    await this.authorizeChannelAccess(channelId, userId);

    const participant = await this.messageRepository.updateReadCursor(
      channelId,
      userId,
      lastReadMessageId
    );

    return {
      channelId: String(channelId),
      userId: String(userId),
      lastReadMessageId: String(lastReadMessageId),
      updatedAt: participant.lastReadAt ? participant.lastReadAt.toISOString() : new Date().toISOString(),
    };
  }
}
