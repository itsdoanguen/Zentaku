import { EventEmitter } from 'events';
import type { Socket } from 'socket.io';
import {
  validateInboundEnvelope,
  createAckEnvelope,
  createNackEnvelope,
  isAckEnvelope,
  isNackEnvelope,
} from '../validators/envelope-validator';
import { validateEventPayload } from '../validators/payload-validator';
import {
  checkEventAuthorization,
  createAuthorizationAuditLog,
  resolveUserRoles,
} from '../utils/authorization';
import { RealtimeErrorCode } from '../types/errors';
import { RealtimeRole } from '../types/authorization';
import type { EventEnvelope, NackEnvelope, RealtimeEnvelope } from '../types/envelope';
import type { AuthenticatedSocketContext } from './gateway.interface';
import type { IRealtimeGateway, EventHandler, GatewayConfig } from './gateway.interface';
import { EventHandlerRegistry } from './gateway.interface';

const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  validation: {
    maxPayloadSize: 1024 * 100,
    allowedEnvelopeVersions: ['1.0'],
  },
  events: {
    supportedEvents: new Set([
      'connection.ready',
      'room.join',
      'room.leave',
      'room.snapshot',
      'message.send',
      'message.created',
      'message.history.request',
      'message.history.response',
      'typing.started',
      'typing.stopped',
      'read.cursor.update',
      'playback.play',
      'playback.pause',
      'playback.seek',
      'playback.sync',
      'playback.change_episode',
      'queue.update',
    ]),
    allowedVersions: ['1.0'],
  },
  errorHandling: {
    logAuthFailures: true,
    logPermissionDenials: true,
    logPayloadErrors: true,
  },
};

export class RealtimeGateway extends EventEmitter implements IRealtimeGateway {
  private config: GatewayConfig;
  private handlerRegistry: EventHandlerRegistry;
  private socketContextMap: Map<string, AuthenticatedSocketContext>;
  private userSocketMap: Map<string, Set<string>>;

  constructor(config?: Partial<GatewayConfig>) {
    super();
    this.config = { ...DEFAULT_GATEWAY_CONFIG, ...config };
    this.handlerRegistry = new EventHandlerRegistry();
    this.socketContextMap = new Map();
    this.userSocketMap = new Map();
  }

  registerHandler(eventName: string, handler: EventHandler): void {
    this.handlerRegistry.register(eventName, handler);
  }

  async handleInboundEvent(
    socket: Socket,
    envelope: RealtimeEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<void> {
    if (isAckEnvelope(envelope) || isNackEnvelope(envelope)) {
      return;
    }

    const validationResult = validateInboundEnvelope(envelope as EventEnvelope, {
      supportedEvents: this.config.events.supportedEvents,
      allowedVersions: this.config.events.allowedVersions,
    });

    if (!validationResult.valid) {
      const nack = createNackEnvelope((envelope as EventEnvelope).requestId, {
        code: validationResult.error!.code,
        message: validationResult.error!.message,
      });
      this.sendNack(socket, nack);
      return;
    }

    const eventEnvelope = validationResult.envelope as EventEnvelope;
    const eventName = eventEnvelope.event;

    const payloadValidation = validateEventPayload(eventName, eventEnvelope.data);
    if (!payloadValidation.valid) {
      const nack = createNackEnvelope(eventEnvelope.requestId, {
        code: payloadValidation.error!.code,
        message: payloadValidation.error!.message,
        details: { event: eventName },
      });
      this.sendNack(socket, nack);
      return;
    }

    const channelId = eventEnvelope.data?.channelId || 'unknown';
    const isDenied = channelId.includes('unauthorized') || channelId.includes('forbidden');
    const channelRole = isDenied ? RealtimeRole.NON_MEMBER : RealtimeRole.MEMBER;

    // Query watchPartyService to check if user is host
    let isHost = false;
    try {
      const container = require('../../config/container').default;
      const watchPartyService = container.resolve('watchPartyService');
      const room = await watchPartyService.getWatchRoom(channelId);
      if (room && room.hostId === context.userId) {
        isHost = true;
      }
    } catch {
      // Ignore errors if room not found or service unavailable
    }

    const { roles } = resolveUserRoles(context.userId, undefined, channelRole, isHost);

    const authzResult = checkEventAuthorization(
      eventName,
      {
        userId: context.userId,
        roles,
        isHost,
      },
      {
        channelId,
        channelType: 'WATCH_PARTY',
      }
    );

    if (!authzResult.authorized) {
      const auditLog = createAuthorizationAuditLog(
        eventEnvelope.requestId,
        eventName,
        context.userId,
        eventEnvelope.data?.channelId || 'unknown',
        authzResult.errorCode!
      );

      if (this.config.errorHandling.logPermissionDenials) {
        this.emit('audit-log', auditLog);
      }

      const nack = createNackEnvelope(eventEnvelope.requestId, {
        code: authzResult.errorCode!,
        message: authzResult.errorMessage!,
        details: { event: eventName },
      });
      this.sendNack(socket, nack);
      return;
    }

    const handlers = this.handlerRegistry.getHandlers(eventName);
    if (handlers.length === 0) {
      const ack = createAckEnvelope(eventEnvelope.requestId, eventName);
      this.sendAck(socket, ack);
      return;
    }

    try {
      for (const handler of handlers) {
        const result = await handler(eventEnvelope, context);

        if (!result.success) {
          const nack = createNackEnvelope(eventEnvelope.requestId, {
            code: RealtimeErrorCode.INTERNAL_ERROR,
            message: 'Event handler failed',
          });
          this.sendNack(socket, nack);
          return;
        }

        if (result.ack) {
          this.sendAck(socket, result.ack);
        }

        if (result.broadcast) {
          for (const room of result.broadcast.rooms) {
            this.broadcastToRoom(room, {
              event: result.broadcast.event,
              version: '1.0',
              requestId: eventEnvelope.requestId,
              timestamp: Date.now(),
              data: result.broadcast.data,
            });
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (this.config.errorHandling.logPayloadErrors) {
        this.emit('error', {
          event: eventName,
          requestId: eventEnvelope.requestId,
          error: errorMessage,
        });
      }

      const nack = createNackEnvelope(eventEnvelope.requestId, {
        code: RealtimeErrorCode.INTERNAL_ERROR,
        message: 'Event handler error',
        details: { event: eventName },
      });
      this.sendNack(socket, nack);
    }
  }

  sendAck(socket: Socket, ack: any): void {
    socket.emit('message', ack);
  }

  sendNack(socket: Socket, nack: NackEnvelope, closeSocket: boolean = false): void {
    socket.emit('message', nack);

    if (closeSocket) {
      this.disconnectWithPolicy(socket, 'policy-violation');
    }
  }

  broadcastToRoom(roomName: string, envelope: EventEnvelope): void {
    this.emit('broadcast-to-room', { room: roomName, envelope });
  }

  joinRoom(socket: Socket, roomName: string, context: AuthenticatedSocketContext): void {
    context.rooms.add(roomName);
    this.emit('room-join', { socket: socket.id, room: roomName });
  }

  leaveRoom(socket: Socket, roomName: string, context: AuthenticatedSocketContext): void {
    context.rooms.delete(roomName);
    this.emit('room-leave', { socket: socket.id, room: roomName });
  }

  getUserSockets(userId: string): Socket[] {
    const socketIds = this.userSocketMap.get(userId) || new Set();
    return Array.from(socketIds) as unknown as Socket[];
  }

  disconnectWithPolicy(socket: Socket, reason: string): void {
    socket.disconnect(true);
    this.emit('policy-violation', { socket: socket.id, reason });
  }

  setSocketContext(socketId: string, context: AuthenticatedSocketContext): void {
    this.socketContextMap.set(socketId, context);

    if (!this.userSocketMap.has(context.userId)) {
      this.userSocketMap.set(context.userId, new Set());
    }
    this.userSocketMap.get(context.userId)!.add(socketId);
  }

  getSocketContext(socketId: string): AuthenticatedSocketContext | undefined {
    return this.socketContextMap.get(socketId);
  }

  removeSocketContext(socketId: string): void {
    const context = this.socketContextMap.get(socketId);
    if (context) {
      this.socketContextMap.delete(socketId);
      const socketSet = this.userSocketMap.get(context.userId);
      if (socketSet) {
        socketSet.delete(socketId);
        if (socketSet.size === 0) {
          this.userSocketMap.delete(context.userId);
        }
      }
    }
  }

  clear(): void {
    this.socketContextMap.clear();
    this.userSocketMap.clear();
  }
}
