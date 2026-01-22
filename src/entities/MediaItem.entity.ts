/**
 * Media Item Entity
 *
 * Abstract base entity for all media types using Single Table Inheritance (STI).
 * The 'type' column acts as discriminator (ANIME, MANGA, NOVEL).
 *
 * This is an abstract class - use AnimeItem, MangaItem, or NovelItem instead.
 *
 * Features:
 * - External sync IDs (AniList, MAL, MangaDex)
 * - Multi-language titles (romaji, english, native)
 * - Rich metadata (cover, banner, description, scores, tags)
 * - Soft delete support
 *
 * Child entities:
 * - AnimeItem (type = ANIME)
 * - MangaItem (type = MANGA)
 * - NovelItem (type = NOVEL)
 */

import { Column, Entity, Index, OneToMany, TableInheritance } from 'typeorm';
import type { Activity } from './Activity.entity';
import { SoftDeletableEntity } from './base/SoftDeletableEntity';
import type { LibraryEntry } from './LibraryEntry.entity';
import type { ListItem } from './ListItem.entity';
import { MediaStatus, MediaType } from './types/enums';
import type { WatchRoomConfig } from './WatchRoomConfig.entity';

@Entity('media_items')
@TableInheritance({ column: { type: 'enum', enum: MediaType, name: 'type' } })
export abstract class MediaItem extends SoftDeletableEntity {
  @Column({ type: 'enum', enum: MediaType })
  type!: MediaType;

  // ==================== SYNC IDS ====================

  @Column({ name: 'id_anilist', type: 'int', nullable: true, unique: true })
  idAnilist?: number | null;

  @Column({ name: 'id_mal', type: 'int', nullable: true, unique: true })
  idMal?: number | null;

  @Column({ name: 'id_mangadex', type: 'varchar', length: 255, nullable: true, unique: true })
  idMangadex?: string | null;

  @Column({ name: 'last_synced_at', type: 'datetime', nullable: true })
  lastSyncedAt?: Date | null;

  // ==================== METADATA ====================

  @Column({ name: 'title_romaji', type: 'varchar', length: 500 })
  @Index()
  titleRomaji!: string;

  @Column({ name: 'title_english', type: 'varchar', length: 500, nullable: true })
  titleEnglish?: string | null;

  @Column({ name: 'title_native', type: 'varchar', length: 500, nullable: true })
  titleNative?: string | null;

  @Column({ type: 'enum', enum: MediaStatus })
  status!: MediaStatus;

  @Column({ name: 'cover_image', type: 'varchar', length: 1000, nullable: true })
  coverImage?: string | null;

  @Column({ name: 'banner_image', type: 'varchar', length: 1000, nullable: true })
  bannerImage?: string | null;

  @Column({ name: 'is_adult', type: 'boolean', default: false })
  isAdult!: boolean;

  @Column({ name: 'average_score', type: 'float', nullable: true })
  averageScore?: number | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'json', nullable: true })
  synonyms?: string[] | null;

  @Column({ type: 'json', nullable: true })
  genres?: string[] | null;

  @Column({ type: 'json', nullable: true })
  tags?: Record<string, unknown>[] | null;

  @Column({ type: 'int', nullable: true })
  popularity?: number | null;

  @Column({ type: 'int', nullable: true })
  favorites?: number | null;

  @Column({ name: 'mean_score', type: 'float', nullable: true })
  meanScore?: number | null;

  // ==================== RELATIONSHIPS ====================

  @OneToMany('LibraryEntry', 'media')
  libraryEntries!: LibraryEntry[];

  @OneToMany('ListItem', 'media')
  listItems!: ListItem[];

  @OneToMany('WatchRoomConfig', 'media')
  watchRooms!: WatchRoomConfig[];

  @OneToMany('Activity', 'media')
  activities!: Activity[];
}
