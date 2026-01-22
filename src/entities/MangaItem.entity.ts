/**
 * Manga Item Entity
 *
 * Extends MediaItem for manga-specific fields.
 * Uses Single Table Inheritance with type discriminator = 'MANGA'.
 *
 * Manga-specific fields:
 * - Chapter and volume counts
 * - Author information (JSON array)
 * - Serialization info
 */

import { ChildEntity, Column } from 'typeorm';
import { MediaItem } from './MediaItem.entity';

@ChildEntity('MANGA')
export class MangaItem extends MediaItem {
  @Column({ type: 'int', nullable: true })
  chapters?: number | null;

  @Column({ type: 'int', nullable: true })
  volumes?: number | null;

  @Column({ type: 'json', nullable: true })
  author?: Array<{ name: string; role: string }> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serialization?: string | null;
}
