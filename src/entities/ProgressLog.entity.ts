/**
 * Progress Log Entity
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
