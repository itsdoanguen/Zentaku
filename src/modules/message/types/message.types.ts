import type { IBaseService } from '../../../core/base/BaseController';
import type { Message as SQLMessage } from '../../../entities/Message.entity';
import type { ChannelParticipant } from '../../../entities/ChannelParticipant.entity';

export interface SendMessageDto {
  content: string;
  replyToId?: string | null;
  attachments?: Record<string, unknown>[] | null;
}

export interface MessageResponseDto {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  replyToId: string | null;
  attachments: Record<string, unknown>[];
  createdAt: string;
}

export interface MessageHistoryQuery {
  cursor?: string;
  limit?: number;
  direction?: 'backward' | 'forward';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedMessagesDto {
  items: MessageResponseDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface IMessageService extends IBaseService {
  sendMessage(channelId: bigint, userId: bigint, data: SendMessageDto): Promise<MessageResponseDto>;

  getMessageHistory(
    channelId: bigint,
    userId: bigint,
    query: MessageHistoryQuery
  ): Promise<PaginatedMessagesDto>;

  updateReadCursor(
    channelId: bigint,
    userId: bigint,
    lastReadMessageId: bigint
  ): Promise<{
    channelId: string;
    userId: string;
    lastReadMessageId: string;
    updatedAt: string;
  }>;
}

export interface IMessageRepository {
  appendMessage(data: {
    channelId: bigint;
    senderId: bigint;
    replyToId?: bigint | null;
    content: string;
    attachments?: Record<string, unknown>[] | null;
  }): Promise<SQLMessage>;

  fetchHistory(
    channelId: bigint,
    options: {
      cursorDate?: Date;
      cursorId?: string;
      limit: number;
      direction: 'backward' | 'forward';
      sortOrder: 'asc' | 'desc';
    }
  ): Promise<any[]>; // returns NoSQL message documents

  updateReadCursor(
    channelId: bigint,
    userId: bigint,
    lastReadMessageId: bigint
  ): Promise<ChannelParticipant>;
}
