/**
 * Notification Handler
 *
 * Handles socket events for notification read status updates.
 * Allows clients to mark notifications as read via Socket.IO
 * in addition to the REST API endpoints.
 */

import logger from '../../shared/utils/logger';
import type { RealtimeGateway } from '../gateway/gateway';
import type { AuthenticatedSocketContext } from '../gateway/gateway.interface';
import type { EventEnvelope } from '../types/envelope';
import { RealtimeErrorCode } from '../types/errors';
import { createAckEnvelope, createNackEnvelope } from '../validators/envelope-validator';

export class NotificationHandler {
  constructor(private readonly gateway: RealtimeGateway) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    logger.debug('[NotificationHandler] Registering notification socket handlers...');

    this.gateway.registerHandler('notification.read', this.handleNotificationRead.bind(this));
    this.gateway.registerHandler(
      'notification.read-all',
      this.handleNotificationReadAll.bind(this)
    );

    logger.info('[NotificationHandler] Handlers successfully registered');
  }

  /**
   * Handle notification.read event from client.
   * Marks a single notification as read.
   */
  async handleNotificationRead(
    envelope: EventEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<any> {
    const notificationId = envelope.data?.notificationId;

    if (!notificationId) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: RealtimeErrorCode.PAYLOAD_INVALID,
          message: 'notificationId is required',
        }),
      };
    }

    try {
      const container = require('../../config/container').default;
      const notificationService = container.resolve('notificationService');

      const updated = await notificationService.markAsRead(
        BigInt(notificationId),
        BigInt(context.userId)
      );

      if (!updated) {
        return {
          success: false,
          nack: createNackEnvelope(envelope.requestId, {
            code: RealtimeErrorCode.INTERNAL_ERROR,
            message: 'Notification not found or already read',
          }),
        };
      }

      return {
        success: true,
        ack: createAckEnvelope(envelope.requestId, 'notification.read'),
      };
    } catch (error: any) {
      logger.error(`[NotificationHandler] Failed to mark notification as read: ${error.message}`);
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: RealtimeErrorCode.INTERNAL_ERROR,
          message: 'Failed to mark notification as read',
        }),
      };
    }
  }

  /**
   * Handle notification.read-all event from client.
   * Marks all unread notifications as read for the user.
   */
  async handleNotificationReadAll(
    envelope: EventEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<any> {
    try {
      const container = require('../../config/container').default;
      const notificationService = container.resolve('notificationService');

      await notificationService.markAllAsRead(BigInt(context.userId));

      return {
        success: true,
        ack: createAckEnvelope(envelope.requestId, 'notification.read-all'),
      };
    } catch (error: any) {
      logger.error(
        `[NotificationHandler] Failed to mark all notifications as read: ${error.message}`
      );
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: RealtimeErrorCode.INTERNAL_ERROR,
          message: 'Failed to mark all notifications as read',
        }),
      };
    }
  }
}
