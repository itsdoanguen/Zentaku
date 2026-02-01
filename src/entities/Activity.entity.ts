/**
 * Activity Entity
 *
 * User activity feed events.
 * Polymorphic relations to media, lists, and communities.
 *
 * Activity types:
 * - WATCHED: User watched an episode
 * - RATED: User rated media
 * - JOINED: User joined a community
 * - CREATED_LIST: User created a list
 * - etc.
 *
 * Features:
 * - Type-based activity classification
 * - JSON metadata for flexible data storage
 * - Polymorphic relations (media, list, community)
 * - Comments support
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import type { Comment } from './Comment.entity';
import { Community } from './Community.entity';
import { CustomList } from './CustomList.entity';
import { MediaItem } from './MediaItem.entity';
import { User } from './User.entity';

@Entity('activities')
export class Activity extends BaseEntity {
  @Column({ name: 'user_id', type: 'bigint' })
  @Index()
  userId!: bigint;

  @Column({ type: 'varchar', length: 100 })
  type!: string; // WATCHED, RATED, JOINED, CREATED_LIST, etc.

  @Column({ name: 'meta_data', type: 'json', nullable: true })
  metaData?: Record<string, unknown> | null;

  // Polymorphic relations
  @Column({ name: 'media_id', type: 'bigint', nullable: true })
  mediaId?: bigint | null;

  @Column({ name: 'list_id', type: 'bigint', nullable: true })
  listId?: bigint | null;

  @Column({ name: 'community_id', type: 'bigint', nullable: true })
  communityId?: bigint | null;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('User', 'activities', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne('MediaItem', 'activities', { nullable: true })
  @JoinColumn({ name: 'media_id' })
  media?: MediaItem | null;

  @ManyToOne('CustomList', 'activities', { nullable: true })
  @JoinColumn({ name: 'list_id' })
  list?: CustomList | null;

  @ManyToOne('Community', 'activities', { nullable: true })
  @JoinColumn({ name: 'community_id' })
  community?: Community | null;

  @OneToMany('Comment', 'activity')
  comments!: Comment[];
}
