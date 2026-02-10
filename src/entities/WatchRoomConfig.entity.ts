/**
 * Watch Room Config Entity
 */

import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { Channel } from './Channel.entity';
import { MediaItem } from './MediaItem.entity';
import { User } from './User.entity';

@Entity('watch_room_configs')
export class WatchRoomConfig extends BaseEntity {
  @PrimaryColumn({ name: 'channel_id', type: 'bigint' })
  channelId!: bigint;

  @Column({ name: 'media_id', type: 'bigint', nullable: true })
  mediaId?: bigint | null;

  @Column({ name: 'host_id', type: 'bigint', nullable: true })
  hostId?: bigint | null;

  @Column({ name: 'is_playing', type: 'boolean', default: false })
  isPlaying!: boolean;

  @Column({ name: 'current_timestamp', type: 'float', default: 0.0 })
  currentTimestamp!: number;

  @Column({ name: 'current_source_url', type: 'varchar', length: 1000, nullable: true })
  currentSourceUrl?: string | null;

  @Column({ name: 'playlist_queue', type: 'json', nullable: true })
  playlistQueue?: Record<string, unknown>[] | null;

  @Column({ type: 'json', nullable: true })
  settings?: Record<string, unknown> | null;

  @Column({ name: 'last_synced_at', type: 'datetime' })
  lastSyncedAt!: Date;

  // ==================== RELATIONSHIPS ====================

  @OneToOne('Channel', 'watchRoomConfig', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel!: Channel;

  @ManyToOne('MediaItem', 'watchRooms', { nullable: true })
  @JoinColumn({ name: 'media_id' })
  media?: MediaItem | null;

  @ManyToOne('User', 'hostedRooms', { nullable: true })
  @JoinColumn({ name: 'host_id' })
  host?: User | null;
}
