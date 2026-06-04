/**
 * Notification Entity
 *
 * Stores user notifications for messages, anime airing reminders, etc.
 */

import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import type { User } from './User.entity';
import { NotificationType } from './types/enums';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id', type: 'bigint' })
  @Index()
  userId!: bigint;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  body?: string | null;

  /**
   * Flexible metadata JSON for different notification types:
   * - MESSAGE: { channelId, senderId, senderName, senderAvatar, messagePreview }
   * - ANIME_AIRING: { animeId, animeName, episodeNumber, airingAt, coverImage }
   */
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  @Index()
  isRead!: boolean;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  readAt?: Date | null;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('User')
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
