import logger from '../../shared/utils/logger';
import type { RealtimeGateway } from '../gateway/gateway';
import type { AuthenticatedSocketContext } from '../gateway/gateway.interface';
import type { EventEnvelope } from '../types/envelope';
import { RealtimeErrorCode } from '../types/errors';
import { createNackEnvelope } from '../validators/envelope-validator';
import type { RoomOrchestratorService } from './room-orchestrator.service';
import { ChatHandler } from '../handlers/chat.handler';

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
    new ChatHandler(this.gateway);
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

    logger.info('[EventDispatcherService] Core handlers registered successfully');
  }
}
