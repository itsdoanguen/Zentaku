/**
 * Realtime Gateway Interface
 * Defines the contract for the realtime gateway layer
 *
 * Layer: Gateway layer handles:
 * - Connect and disconnect
 * - Envelope validation
 * - Event routing
 */

import type { EventEmitter } from 'events';
import type { Socket } from 'socket.io';
import type { AckEnvelope, EventEnvelope, NackEnvelope, RealtimeEnvelope } from '../types/envelope';

/**
 * Socket context after authentication
 */
export interface AuthenticatedSocketContext {
  socketId: string;
  userId: string;
  sessionId: string;
  authenticatedAt: number;
  rooms: Set<string>; // Set of joined channelIds
}

/**
 * Event handler result
 */
export interface EventHandlerResult {
  success: boolean;
  ack?: AckEnvelope;
  nack?: NackEnvelope;
  broadcast?: {
    event: string;
    data: any;
    rooms: string[]; // Rooms to broadcast to
  };
}

/**
 * Event handler function
 */
export type EventHandler = (
  envelope: EventEnvelope,
  context: AuthenticatedSocketContext
) => Promise<EventHandlerResult>;

/**
 * Gateway interface
 */
export interface IRealtimeGateway extends EventEmitter {
  /**
   * Register an event handler
   */
  registerHandler(eventName: string, handler: EventHandler): void;

  /**
   * Handle inbound event from socket
   */
  handleInboundEvent(
    socket: Socket,
    envelope: RealtimeEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<void>;

  /**
   * Send ack to socket
   */
  sendAck(socket: Socket, ack: AckEnvelope): void;

  /**
   * Send nack to socket
   */
  sendNack(socket: Socket, nack: NackEnvelope, closeSocket?: boolean): void;

  /**
   * Broadcast event to room
   */
  broadcastToRoom(roomName: string, envelope: EventEnvelope): void;

  /**
   * Join socket to room
   */
  joinRoom(socket: Socket, roomName: string, context: AuthenticatedSocketContext): void;

  /**
   * Leave socket from room
   */
  leaveRoom(socket: Socket, roomName: string, context: AuthenticatedSocketContext): void;

  /**
   * Get user's sockets
   */
  getUserSockets(userId: string): Socket[];

  /**
   * Disconnect socket with policy violation
   */
  disconnectWithPolicy(socket: Socket, reason: string): void;
}

/**
 * Gateway configuration
 */
export interface GatewayConfig {
  // Validation configuration
  validation: {
    maxPayloadSize: number; // bytes
    allowedEnvelopeVersions: string[];
  };

  // Event configuration
  events: {
    supportedEvents: Set<string>;
    allowedVersions: string[];
  };

  // Error handling
  errorHandling: {
    logAuthFailures: boolean;
    logPermissionDenials: boolean;
    logPayloadErrors: boolean;
  };
}

/**
 * Event handler registry
 */
export class EventHandlerRegistry {
  private handlers: Map<string, EventHandler[]> = new Map();

  register(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
  }

  getHandlers(eventName: string): EventHandler[] {
    return this.handlers.get(eventName) || [];
  }

  clear(): void {
    this.handlers.clear();
  }
}
