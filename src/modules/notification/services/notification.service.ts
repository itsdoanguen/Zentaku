/**
 * Notification Service
 *
 * Business logic for creating, managing, and pushing notifications.
 * Handles both persistence (DB) and realtime delivery (Socket.IO).
 */

import { randomUUID } from 'crypto';
import type { NotificationType } from '../../../entities/types/enums';
import type { RealtimeGateway } from '../../../realtime/gateway/gateway';
import logger from '../../../shared/utils/logger';
import type {
  NotificationRepository,
  CreateNotificationData,
  FindNotificationsOptions,
} from '../repositories/notification.repository';

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  /**
   * Create a notification, persist it to DB, and push it to the user via Socket.IO.
   */
  async createAndPush(
    userId: bigint,
    type: NotificationType,
    title: string,
    body?: string,
    metadata?: Record<string, unknown>
  ): Promise<NotificationPayload> {
    // 1. Persist to database
    const data: CreateNotificationData = {
      userId,
      type,
      title,
      body,
      metadata,
    };

    const notification = await this.notificationRepository.create(data);

    // 2. Build payload for realtime delivery
    const payload: NotificationPayload = {
      id: notification.id.toString(),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      metadata: notification.metadata,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };

    // 3. Push to user via socket (user room: "user:{userId}")
    this.pushToUser(userId.toString(), payload);

    logger.debug(
      `[NotificationService] Created and pushed notification for user ${userId}: ${type} - ${title}`
    );

    return payload;
  }

  /**
   * Push a notification payload to a specific user via their personal socket room.
   */
  private pushToUser(userId: string, payload: NotificationPayload): void {
    try {
      this.realtimeGateway.broadcastToRoom(`user:${userId}`, {
        event: 'notification.new',
        version: '1.0',
        requestId: randomUUID(),
        timestamp: Date.now(),
        data: payload,
      });
    } catch (error: any) {
      logger.error(
        `[NotificationService] Failed to push notification to user ${userId}: ${error.message}`
      );
    }
  }

  /**
   * Get paginated notifications for a user.
   */
  async getUserNotifications(userId: bigint, page: number = 1, limit: number = 20) {
    const options: FindNotificationsOptions = { page, limit };
    const { notifications, total } = await this.notificationRepository.findByUserId(
      userId,
      options
    );

    const totalPages = Math.ceil(total / limit);

    return {
      notifications: notifications.map((n) => ({
        id: n.id.toString(),
        type: n.type,
        title: n.title,
        body: n.body,
        metadata: n.metadata,
        isRead: n.isRead,
        readAt: n.readAt?.toISOString() || null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount: await this.notificationRepository.getUnreadCount(userId),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: bigint): Promise<number> {
    return this.notificationRepository.getUnreadCount(userId);
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: bigint, userId: bigint): Promise<boolean> {
    return this.notificationRepository.markAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: bigint): Promise<number> {
    return this.notificationRepository.markAllAsRead(userId);
  }
}
