/**
 * Comment Entity
 */

import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Activity } from './Activity.entity';
import { BaseEntity } from './base/BaseEntity';
import { User } from './User.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ name: 'user_id', type: 'bigint' })
  @Index()
  userId!: bigint;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'is_spoiler', type: 'boolean', default: false })
  isSpoiler!: boolean;

  @Column({ name: 'like_count', type: 'int', default: 0 })
  likeCount!: number;

  @Column({ name: 'activity_id', type: 'bigint', nullable: true })
  activityId?: bigint | null;

  // Polymorphic target
  @Column({ name: 'target_type', type: 'varchar', length: 50, nullable: true })
  targetType?: string | null; // MEDIA, LIST, EPISODE

  @Column({ name: 'target_id', type: 'bigint', nullable: true })
  targetId?: bigint | null;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('User', 'comments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne('Activity', 'comments', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity?: Activity | null;
}
