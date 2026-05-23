import logger from '../../shared/utils/logger';
import type { RealtimeGateway } from '../gateway/gateway';
import type { AuthenticatedSocketContext } from '../gateway/gateway.interface';
import type { EventEnvelope } from '../types/envelope';
import { RealtimeErrorCode } from '../types/errors';
import { createNackEnvelope, createAckEnvelope } from '../validators/envelope-validator';
import type { RoomOrchestratorService } from './room-orchestrator.service';

/**
 * Event Dispatcher Service
 * Acts as the centralized registry routing inbound gateway events to appropriate handlers.
 *
 */
export class EventDispatcherService {
  constructor(
    private gateway: RealtimeGateway,
    private roomOrchestrator: RoomOrchestratorService
  ) {
    this.registerCoreHandlers();
  }

  private registerCoreHandlers(): void {
    logger.debug('[EventDispatcherService] Registering core handlers...');

    // 1. Register room.join handler
    this.gateway.registerHandler(
      'room.join',
      async (envelope: EventEnvelope, context: AuthenticatedSocketContext) => {
        const channelId = envelope.data?.channelId;
        if (!channelId) {
          return {
            success: false,
            nack: createNackEnvelope(envelope.requestId, {
              code: RealtimeErrorCode.PAYLOAD_INVALID,
              message: 'channelId is required in data payload',
            }),
          };
        }

        const socket = (this.gateway as any).getSocket?.(context.socketId);
        if (!socket) {
          return {
            success: false,
            nack: createNackEnvelope(envelope.requestId, {
              code: RealtimeErrorCode.INTERNAL_ERROR,
              message: 'Socket connection not found',
            }),
          };
        }

        await this.roomOrchestrator.handleJoinRoom(socket, channelId, context, envelope.requestId);
        return { success: true };
      }
    );

    // 2. Register room.leave handler
    this.gateway.registerHandler(
      'room.leave',
      async (envelope: EventEnvelope, context: AuthenticatedSocketContext) => {
        const channelId = envelope.data?.channelId;
        if (!channelId) {
          return {
            success: false,
            nack: createNackEnvelope(envelope.requestId, {
              code: RealtimeErrorCode.PAYLOAD_INVALID,
              message: 'channelId is required in data payload',
            }),
          };
        }

        const socket = (this.gateway as any).getSocket?.(context.socketId);
        if (!socket) {
          return {
            success: false,
            nack: createNackEnvelope(envelope.requestId, {
              code: RealtimeErrorCode.INTERNAL_ERROR,
              message: 'Socket connection not found',
            }),
          };
        }

        await this.roomOrchestrator.handleLeaveRoom(socket, channelId, context, envelope.requestId);
        return { success: true };
      }
    );

    // 3. Register message.send handler
    this.gateway.registerHandler(
      'message.send',
      async (envelope: EventEnvelope, context: AuthenticatedSocketContext) => {
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
          const messageService = container.resolve('messageService');
          const savedMessage = await messageService.sendMessage(
            BigInt(channelId),
            BigInt(context.userId),
            { content, replyToId, attachments }
          );

          return {
            success: true,
            ack: createAckEnvelope(envelope.requestId, 'message.send', savedMessage),
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
    );

    // 4. Register typing.started handler
    this.gateway.registerHandler(
      'typing.started',
      async (envelope: EventEnvelope, context: AuthenticatedSocketContext) => {
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
    );

    // 5. Register typing.stopped handler
    this.gateway.registerHandler(
      'typing.stopped',
      async (envelope: EventEnvelope, context: AuthenticatedSocketContext) => {
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
    );

    // 6. Register read.cursor.update handler
    this.gateway.registerHandler(
      'read.cursor.update',
      async (envelope: EventEnvelope, context: AuthenticatedSocketContext) => {
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

        try {
          const container = require('../../config/container').default;
          const messageService = container.resolve('messageService');
          const result = await messageService.updateReadCursor(
            BigInt(channelId),
            BigInt(context.userId),
            BigInt(lastReadMessageId)
          );

          return {
            success: true,
            ack: createAckEnvelope(envelope.requestId, 'read.cursor.update', result),
            broadcast: {
              rooms: [`channel:${channelId}`],
              event: 'read.cursor.updated',
              data: result,
            },
          };
        } catch (error: any) {
          return {
            success: false,
            nack: createNackEnvelope(envelope.requestId, {
              code: error.code || RealtimeErrorCode.INTERNAL_ERROR,
              message: error.message || 'Failed to update read cursor',
            }),
          };
        }
      }
    );

    logger.info('[EventDispatcherService] Core handlers registered successfully');
  }
}
