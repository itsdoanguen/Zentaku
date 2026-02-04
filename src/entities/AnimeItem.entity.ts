/**
 * Anime Item Entity
 */

import { ChildEntity, Column } from 'typeorm';
import { MediaItem } from './MediaItem.entity';
import { AnimeSeason } from './types/enums';

@ChildEntity('ANIME')
export class AnimeItem extends MediaItem {
  @Column({ name: 'episode_count', type: 'int', nullable: true })
  episodeCount?: number | null;

  @Column({ name: 'duration_min', type: 'int', nullable: true })
  durationMin?: number | null;

  @Column({ type: 'enum', enum: AnimeSeason, nullable: true })
  season?: AnimeSeason | null;

  @Column({ name: 'season_year', type: 'int', nullable: true })
  seasonYear?: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  studio?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source?: string | null;

  @Column({ name: 'trailer_url', type: 'varchar', length: 1000, nullable: true })
  trailerUrl?: string | null;

  @Column({ name: 'next_airing_episode', type: 'json', nullable: true })
  nextAiringEpisode?: Record<string, unknown> | null;
}
