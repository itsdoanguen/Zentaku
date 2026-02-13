/**
 * Reading Media Item Entity
 *
 * Handles both Manga and Novel reading media.
 * Differentiation is done via the 'format' field.
 *
 */

import { ChildEntity, Column } from 'typeorm';
import { MediaItem } from './MediaItem.entity';

@ChildEntity('MANGA')
export class ReadingMediaItem extends MediaItem {
  @Column({ type: 'varchar', length: 50, nullable: true })
  format?: string | null;

  @Column({ type: 'int', nullable: true })
  chapters?: number | null;

  @Column({ type: 'int', nullable: true })
  volumes?: number | null;

  @Column({ type: 'json', nullable: true })
  author?: Array<{ name: string; role: string }> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serialization?: string | null;
}
