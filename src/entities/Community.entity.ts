/**
 * Community Entity
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import type { Activity } from './Activity.entity';
import { SoftDeletableEntity } from './base/SoftDeletableEntity';
import type { Channel } from './Channel.entity';
import type { CommunityMember } from './CommunityMember.entity';
import { User } from './User.entity';

@Entity('communities')
export class Community extends SoftDeletableEntity {
  @Column({ name: 'owner_id', type: 'bigint' })
  @Index()
  ownerId!: bigint;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic!: boolean;

  @Column({ name: 'invite_code', type: 'varchar', length: 50, nullable: true, unique: true })
  inviteCode?: string | null;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('User', 'ownedCommunities')
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @OneToMany('CommunityMember', 'community')
  members!: CommunityMember[];

  @OneToMany('Channel', 'community')
  channels!: Channel[];

  @OneToMany('Activity', 'community')
  activities!: Activity[];
}
