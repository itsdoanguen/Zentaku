/**
 * Library Entry Entity
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { MediaItem } from './MediaItem.entity';
import type { ProgressLog } from './ProgressLog.entity';
import { LibraryStatus } from './types/enums';
import { User } from './User.entity';

@Entity('library_entries')
@Unique(['userId', 'mediaId'])
export class LibraryEntry extends BaseEntity {
  @Column({ name: 'user_id', type: 'bigint' })
  @Index()
  userId!: bigint;

  @Column({ name: 'media_id', type: 'bigint' })
  @Index()
  mediaId!: bigint;

  @Column({ type: 'enum', enum: LibraryStatus })
  status!: LibraryStatus;

  @Column({ type: 'int', default: 0 })
  progress!: number;

  @Column({ name: 'progress_volumes', type: 'int', nullable: true })
  progressVolumes?: number | null;

  @Column({ type: 'float', nullable: true })
  score?: number | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'is_private', type: 'boolean', default: false })
  isPrivate!: boolean;

  @Column({ name: 'rewatch_count', type: 'int', default: 0 })
  rewatchCount!: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date | null;

  @Column({ name: 'finish_date', type: 'date', nullable: true })
  finishDate?: Date | null;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('User', 'libraryEntries', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne('MediaItem', 'libraryEntries', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id' })
  media!: MediaItem;

  @OneToMany('ProgressLog', 'entry')
  progressLogs!: ProgressLog[];
}
