/**
 * Channel Participant Entity
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseJoinEntity } from './base/BaseJoinEntity';
import { Channel } from './Channel.entity';
import { User } from './User.entity';

@Entity('channel_participants')
export class ChannelParticipant extends BaseJoinEntity {
  @PrimaryColumn({ name: 'channel_id', type: 'bigint' })
  channelId!: bigint;

  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId!: bigint;

  @Column({ name: 'last_read_at', type: 'datetime', nullable: true })
  lastReadAt?: Date | null;

  @Column({ name: 'is_muted', type: 'boolean', default: false })
  isMuted!: boolean;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('Channel', 'participants', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel!: Channel;

  @ManyToOne('User', 'channelParticipants', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
