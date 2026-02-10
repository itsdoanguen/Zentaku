/**
 * Novel Item Entity
 */

import { ChildEntity, Column } from 'typeorm';
import { MediaItem } from './MediaItem.entity';

@ChildEntity('NOVEL')
export class NovelItem extends MediaItem {
  @Column({ type: 'int', nullable: true })
  chapters?: number | null;

  @Column({ type: 'int', nullable: true })
  volumes?: number | null;

  @Column({ type: 'json', nullable: true })
  author?: Array<{ name: string; role: string }> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serialization?: string | null;
}
