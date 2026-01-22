/**
 * Progress Log Entity
 *
 * Records each progress update for a library entry.
 * Creates a history of when user watched/read each episode/chapter.
 *
 * Use cases:
 * - Activity feed generation
 * - Progress history tracking
 * - Statistics and analytics
 */

import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { LibraryEntry } from './LibraryEntry.entity';
import { User } from './User.entity';

@Entity('progress_logs')
export class ProgressLog extends BaseEntity {
  @Column({ name: 'entry_id', type: 'bigint' })
  @Index()
  entryId!: bigint;

  @Column({ name: 'user_id', type: 'bigint' })
  @Index()
  userId!: bigint;

  @Column({ name: 'progress_number', type: 'int' })
  progressNumber!: number;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('LibraryEntry', 'progressLogs', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entry_id' })
  entry!: LibraryEntry;

  @ManyToOne('User', 'progressLogs', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
