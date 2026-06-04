/**
 * Notification Repository
 *
 * Data access layer for Notification entities.
 */

import type { Repository, FindOptionsWhere } from 'typeorm';
import type { Notification } from '../../../entities/Notification.entity';
import type { NotificationType } from '../../../entities/types/enums';

export interface CreateNotificationData {
  userId: bigint;
  type: NotificationType;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

export interface FindNotificationsOptions {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export class NotificationRepository {
  constructor(private readonly repository: Repository<Notification>) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    const notification = this.repository.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body || null,
      metadata: data.metadata || null,
      isRead: false,
    });

    return this.repository.save(notification);
  }

  async findByUserId(
    userId: bigint,
    options: FindNotificationsOptions = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { page = 1, limit = 20, isRead } = options;

    const where: FindOptionsWhere<Notification> = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [notifications, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { notifications, total };
  }

  async getUnreadCount(userId: bigint): Promise<number> {
    return this.repository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: bigint, userId: bigint): Promise<boolean> {
    const result = await this.repository.update(
      { id: notificationId, userId },
      { isRead: true, readAt: new Date() }
    );

    return (result.affected ?? 0) > 0;
  }

  async markAllAsRead(userId: bigint): Promise<number> {
    const result = await this.repository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return result.affected ?? 0;
  }

  async findById(notificationId: bigint): Promise<Notification | null> {
    return this.repository.findOne({
      where: { id: notificationId },
    });
  }
}
