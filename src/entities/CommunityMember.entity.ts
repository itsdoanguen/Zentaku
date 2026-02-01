/**
 * Community Member Entity
 *
 * Junction table for community membership.
 * Uses composite primary key (community_id, user_id).
 * Extends BaseJoinEntity (no ID, only creation timestamp).
 *
 * Features:
 * - Role-based permissions (ADMIN, MODERATOR, MEMBER)
 * - Optional nickname within community
 * - Join timestamp tracking
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseJoinEntity } from './base/BaseJoinEntity';
import { Community } from './Community.entity';
import { UserRole } from './types/enums';
import { User } from './User.entity';

@Entity('community_members')
export class CommunityMember extends BaseJoinEntity {
  @PrimaryColumn({ name: 'community_id', type: 'bigint' })
  communityId!: bigint;

  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId!: bigint;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role!: UserRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nickname?: string | null;

  @Column({ name: 'joined_at', type: 'datetime' })
  joinedAt!: Date;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('Community', 'members', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'community_id' })
  community!: Community;

  @ManyToOne('User', 'joinedCommunities', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
