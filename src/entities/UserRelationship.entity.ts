/**
 * User Relationship Entity
 *
 * Represents social connections between users.
 * Uses composite primary key (follower_id, following_id).
 * Extends BaseJoinEntity (no ID, only creation timestamp).
 *
 * Relationship types:
 * - FOLLOW: One-way follow
 * - FRIEND: Mutual follow (bidirectional)
 * - BLOCK: User blocking
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseJoinEntity } from './base/BaseJoinEntity';
import { RelationshipType } from './types/enums';
import { User } from './User.entity';

@Entity('user_relationships')
export class UserRelationship extends BaseJoinEntity {
  @PrimaryColumn({ name: 'follower_id', type: 'bigint' })
  followerId!: bigint;

  @PrimaryColumn({ name: 'following_id', type: 'bigint' })
  followingId!: bigint;

  @Column({ type: 'enum', enum: RelationshipType })
  type!: RelationshipType;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('User', 'following', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower!: User;

  @ManyToOne('User', 'followers', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following!: User;
}
