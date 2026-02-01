/**
 * Channel Entity
 *
 * Communication channels within communities or as DM channels.
 * Supports multiple channel types (TEXT, VOICE, WATCH_PARTY).
 *
 * Features:
 * - Multiple channel types
 * - Public/Private access
 * - Custom ordering (position)
 * - Optional community (null for DM channels)
 * - One-to-one relation with WatchRoomConfig for watch parties
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import type { ChannelParticipant } from './ChannelParticipant.entity';
import { Community } from './Community.entity';
import type { Message } from './Message.entity';
import { ChannelType } from './types/enums';
import type { WatchRoomConfig } from './WatchRoomConfig.entity';

@Entity('channels')
export class Channel extends BaseEntity {
  @Column({ name: 'community_id', type: 'bigint', nullable: true })
  @Index()
  communityId?: bigint | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string | null;

  @Column({ type: 'enum', enum: ChannelType })
  type!: ChannelType;

  @Column({ name: 'is_private', type: 'boolean', default: false })
  isPrivate!: boolean;

  @Column({ type: 'int', default: 0 })
  position!: number;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('Community', 'channels', { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'community_id' })
  community?: Community | null;

  @OneToMany('ChannelParticipant', 'channel')
  participants!: ChannelParticipant[];

  @OneToMany('Message', 'channel')
  messages!: Message[];

  @OneToOne('WatchRoomConfig', 'channel', { nullable: true })
  watchRoomConfig?: WatchRoomConfig | null;
}
