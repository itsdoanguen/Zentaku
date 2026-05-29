/**
 * Realtime Module
 *
 */

export * from './gateway';
export * from './services';
export * from './types';
export * from './utils';
export * from './validators';

import { randomUUID } from 'crypto';
import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Container } from '../config/container';
import logger from '../shared/utils/logger';
import type { RealtimeGateway } from './gateway/gateway';
import { createAuthMiddleware } from './gateway/middleware';
import { createNackEnvelope } from './validators/envelope-validator';

export function initializeRealtime(server: HttpServer, container: Container): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
    },
  });

  const gateway = container.resolve<RealtimeGateway>('realtimeGateway');

  (gateway as any).getSocket = (socketId: string) => {
    return io.sockets.sockets.get(socketId);
  };

  (gateway as any).getRoomParticipants = (roomName: string): any[] => {
    const roomSockets = io.sockets.adapter.rooms.get(roomName);
    if (!roomSockets) return [];
    const participants: any[] = [];
    for (const socketId of roomSockets) {
      const ctx = gateway.getSocketContext(socketId);
      if (ctx) {
        participants.push({
          userId: ctx.userId,
          displayName: ctx.displayName,
          avatar: ctx.avatar,
        });
      }
    }
    // De-duplicate participants by userId
    const uniqueMap = new Map<string, any>();
    for (const p of participants) {
      uniqueMap.set(p.userId, p);
    }
    return Array.from(uniqueMap.values());
  };

  io.use(createAuthMiddleware());

  io.on('connection', (socket) => {
    const authError = (socket as any).authError;
    if (authError) {
      logger.warn(`[Realtime] Auth failure for socket ${socket.id}: ${authError.message}`);
      const nack = createNackEnvelope(randomUUID(), {
        code: authError.code,
        message: authError.message,
      });
      socket.emit('message', nack);
      // Immediately close connection with policy-violation semantics (auth-v1.md)
      socket.disconnect(true);
      return;
    }

    const context = socket.data.context;
    if (!context) {
      logger.error(`[Realtime] Connected socket ${socket.id} has no authentication context`);
      socket.disconnect(true);
      return;
    }

    logger.info(
      `[Realtime] Client connected successfully: userId=${context.userId}, socketId=${socket.id}`
    );
    gateway.setSocketContext(socket.id, context);

    socket.emit('message', {
      event: 'connection.ready',
      version: '1.0',
      requestId: randomUUID(),
      timestamp: Date.now(),
      data: {
        userId: context.userId,
        sessionId: context.sessionId,
      },
    });

    //Handle incoming message events and route to gateway
    socket.on('message', async (envelope) => {
      logger.info(`[Realtime] Received inbound message from ${socket.id}: ${envelope.event}`);
      try {
        await gateway.handleInboundEvent(socket, envelope, context);
      } catch (error: any) {
        logger.error(
          `[Realtime] Error processing inbound event on socket ${socket.id}: ${error.message}`
        );
      }
    });

    //Clean up on disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`[Realtime] Client disconnected: socketId=${socket.id}, reason=${reason}`);
      if (context.rooms) {
        for (const roomName of context.rooms) {
          const channelId = roomName.startsWith('channel:') ? roomName.substring(8) : roomName;
          gateway.broadcastToRoom(roomName, {
            event: 'presence.left',
            version: '1.0',
            requestId: randomUUID(),
            timestamp: Date.now(),
            data: {
              channelId,
              userId: context.userId,
              displayName: context.displayName,
              avatar: context.avatar,
            },
          });
        }
      }
      gateway.removeSocketContext(socket.id);
    });
  });

  //Handle gateway broadcast emissions
  gateway.on('broadcast-to-room', ({ room, envelope }) => {
    logger.debug(`[Realtime] Broadcasting to room ${room}: ${envelope.event}`);
    io.to(room).emit('message', envelope);
  });

  //Handle room join/leave socket actions from gateway events
  gateway.on('room-join', ({ socket: socketId, room }) => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      logger.debug(`[Realtime] Socket ${socketId} joining room ${room}`);
      socket.join(room);
    }
  });

  gateway.on('room-leave', ({ socket: socketId, room }) => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      logger.debug(`[Realtime] Socket ${socketId} leaving room ${room}`);
      socket.leave(room);
    }
  });

  logger.info('[Realtime] Socket.IO server transport initialized and bound to HTTP server');
  return io;
}
