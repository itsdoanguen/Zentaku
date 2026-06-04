import logger from '../../shared/utils/logger';
import type { RealtimeGateway } from '../gateway/gateway';
import type { AuthenticatedSocketContext } from '../gateway/gateway.interface';
import type { EventEnvelope } from '../types/envelope';
import { RealtimeErrorCode } from '../types/errors';
import { createAckEnvelope, createNackEnvelope } from '../validators/envelope-validator';

export class ChatHandler {
  private cursorCache = new Map<string, { lastReadMessageId: bigint; timer: NodeJS.Timeout }>();

  constructor(private readonly gateway: RealtimeGateway) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    logger.debug('[ChatHandler] Registering chat socket handlers...');

    this.gateway.registerHandler('message.send', this.handleSendMessage.bind(this));
    this.gateway.registerHandler('typing.started', this.handleTypingStarted.bind(this));
    this.gateway.registerHandler('typing.stopped', this.handleTypingStopped.bind(this));
    this.gateway.registerHandler('read.cursor.update', this.handleReadCursorUpdate.bind(this));

    logger.info('[ChatHandler] Handlers successfully registered');
  }

  async handleSendMessage(
    envelope: EventEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<any> {
    const channelId = envelope.data?.channelId;
    const content = envelope.data?.content;
    const replyToId = envelope.data?.replyToId;
    const attachments = envelope.data?.attachments;

    if (!channelId || !content) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: RealtimeErrorCode.PAYLOAD_INVALID,
          message: 'channelId and content are required',
        }),
      };
    }

    try {
      const container = require('../../config/container').default;

      // Check if this channel is a watch party
      const watchPartyService = container.resolve('watchPartyService');
      let isWatchParty = false;
      try {
        const room = await watchPartyService.getWatchRoom(channelId);
        if (room) isWatchParty = true;
      } catch (err) {
        console.error('[ChatHandler] getWatchRoom error:', err);
      }

      console.log(`[ChatHandler] message.send channelId=${channelId} isWatchParty=${isWatchParty}`);

      if (isWatchParty) {
        const tempMessage = {
          id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          channelId,
          content,
          senderId: context.userId,
          senderName: context.displayName,
          createdAt: new Date().toISOString(),
          replyToId,
          attachments,
        };

        watchPartyService.addMessage(channelId, tempMessage);

        return {
          success: true,
          ack: createAckEnvelope(envelope.requestId, 'message.send'),
          broadcast: {
            rooms: [`channel:${channelId}`],
            event: 'message.created',
            data: tempMessage,
          },
        };
      }

      const messageService = container.resolve('messageService');
      const savedMessage = await messageService.sendMessage(
        BigInt(channelId),
        BigInt(context.userId),
        { content, replyToId, attachments }
      );

      return {
        success: true,
        ack: createAckEnvelope(envelope.requestId, 'message.send', savedMessage as any),
        broadcast: {
          rooms: [`channel:${channelId}`],
          event: 'message.created',
          data: savedMessage,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: error.code || RealtimeErrorCode.INTERNAL_ERROR,
          message: error.message || 'Failed to send message',
        }),
      };
    }
  }

  async handleTypingStarted(
    envelope: EventEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<any> {
    const channelId = envelope.data?.channelId;
    if (!channelId) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: RealtimeErrorCode.PAYLOAD_INVALID,
          message: 'channelId is required',
        }),
      };
    }

    return {
      success: true,
      ack: createAckEnvelope(envelope.requestId, 'typing.started'),
      broadcast: {
        rooms: [`channel:${channelId}`],
        event: 'typing.started',
        data: { channelId, userId: context.userId },
      },
    };
  }

  async handleTypingStopped(
    envelope: EventEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<any> {
    const channelId = envelope.data?.channelId;
    if (!channelId) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: RealtimeErrorCode.PAYLOAD_INVALID,
          message: 'channelId is required',
        }),
      };
    }

    return {
      success: true,
      ack: createAckEnvelope(envelope.requestId, 'typing.stopped'),
      broadcast: {
        rooms: [`channel:${channelId}`],
        event: 'typing.stopped',
        data: { channelId, userId: context.userId },
      },
    };
  }

  async handleReadCursorUpdate(
    envelope: EventEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<any> {
    const channelId = envelope.data?.channelId;
    const lastReadMessageId = envelope.data?.lastReadMessageId;

    if (!channelId || !lastReadMessageId) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: RealtimeErrorCode.PAYLOAD_INVALID,
          message: 'channelId and lastReadMessageId are required',
        }),
      };
    }

    const key = `${context.userId}:${channelId}`;

    // Check if there is an existing debounce timer in our memory cache
    const cached = this.cursorCache.get(key);
    if (cached) {
      clearTimeout(cached.timer);
    }

    // Set a debounce timer to commit the read cursor to database in 2 seconds of silence
    const timer = setTimeout(async () => {
      try {
        const container = require('../../config/container').default;
        const messageService = container.resolve('messageService');
        const result = await messageService.updateReadCursor(
          BigInt(channelId),
          BigInt(context.userId),
          BigInt(lastReadMessageId)
        );

        // Broadcast the updated cursor representation to the channel room
        this.gateway.broadcastToRoom(`channel:${channelId}`, {
          event: 'read.cursor.updated',
          version: '1.0',
          requestId: envelope.requestId,
          timestamp: Date.now(),
          data: result,
        });

        // Delete from local cache upon successful DB commit
        this.cursorCache.delete(key);
      } catch (error: any) {
        logger.error(
          `[ChatHandler] Failed to save debounced read cursor for user ${context.userId}: ${error.message}`
        );
      }
    }, 2000);

    this.cursorCache.set(key, { lastReadMessageId: BigInt(lastReadMessageId), timer });

    // Respond with immediate success to the client
    return {
      success: true,
      ack: createAckEnvelope(envelope.requestId, 'read.cursor.update'),
    };
  }

  // Flush hook to persist any outstanding cursors in cache (e.g., during app shutdown)
  async flush(): Promise<void> {
    logger.debug('[ChatHandler] Flushing outstanding debounced cursors...');
    const container = require('../../config/container').default;
    const messageService = container.resolve('messageService');

    for (const [key, cache] of this.cursorCache.entries()) {
      clearTimeout(cache.timer);
      const [userId, channelId] = key.split(':');
      if (userId && channelId) {
        try {
          await messageService.updateReadCursor(
            BigInt(channelId),
            BigInt(userId),
            cache.lastReadMessageId
          );
        } catch (error: any) {
          logger.error(`[ChatHandler] Flush failed for key ${key}: ${error.message}`);
        }
      }
    }
    this.cursorCache.clear();
  }
}
