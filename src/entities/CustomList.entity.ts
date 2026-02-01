/**
 * Custom List Entity
 *
 * User-created lists that can be shared with others.
 * Supports collaborative editing with invitations.
 *
 * Features:
 * - Public/Private/Shared privacy modes
 * - Unique slug for URL-friendly access
 * - Optional banner image
 * - JSON settings for customization
 * - Soft delete support
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import type { Activity } from './Activity.entity';
import { SoftDeletableEntity } from './base/SoftDeletableEntity';
import type { ListInvitation } from './ListInvitation.entity';
import type { ListItem } from './ListItem.entity';
import { PrivacyMode } from './types/enums';
import { User } from './User.entity';

@Entity('custom_lists')
export class CustomList extends SoftDeletableEntity {
  @Column({ name: 'owner_id', type: 'bigint' })
  @Index()
  ownerId!: bigint;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'enum', enum: PrivacyMode, default: PrivacyMode.PUBLIC })
  privacy!: PrivacyMode;

  @Column({ name: 'banner_image', type: 'varchar', length: 1000, nullable: true })
  bannerImage?: string | null;

  @Column({ type: 'json', nullable: true })
  settings?: Record<string, unknown> | null;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('User', 'ownedLists', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @OneToMany('ListItem', 'list')
  items!: ListItem[];

  @OneToMany('ListInvitation', 'list')
  invitations!: ListInvitation[];

  @OneToMany('Activity', 'list')
  activities!: Activity[];
}
