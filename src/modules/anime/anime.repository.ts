import type { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { BaseMediaRepository } from '../../core/base/BaseMediaRepository';
import { AnimeItem } from '../../entities';

/**
 * Anime create/update data structure
 */
interface AnimeCreateData {
  idAnilist: number;
  idMal?: number | null;
  lastSyncedAt?: Date;
  titleRomaji: string;
  titleEnglish?: string | null;
  titleNative?: string | null;
  status: 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED';
  coverImage?: string | null;
  bannerImage?: string | null;
  isAdult?: boolean;
  averageScore?: number | null;
  meanScore?: number | null;
  description?: string | null;
  synonyms?: string[] | null;
  genres?: string[] | null;
  tags?: unknown[] | null;
  popularity?: number | null;
  favorites?: number | null;
  episodeCount?: number | null;
  durationMin?: number | null;
  season?: string | null;
  seasonYear?: number | null;
  studio?: string | null;
  source?: string | null;
  trailerUrl?: string | null;
  nextAiringEpisode?: object | null;
}

/**
 * Anime Repository
 *
 * Handles data access for anime entities.
 * Extends BaseMediaRepository to inherit common media operations.
 *
 * Features:
 * - External ID lookups
 * - Anime upsert with metadata
 * - Inherited: CRUD, pagination, search, filtering
 *
 * @extends BaseMediaRepository
 */
class AnimeRepository extends BaseMediaRepository<AnimeItem> {
  /**
   * Create anime repository instance
   *
   * @param repository - TypeORM repository instance (injected by DI container)
   */
  constructor(repository?: Repository<AnimeItem>) {
    super(repository || AppDataSource.getRepository(AnimeItem));
  }

  // ==================== IMediaRepository IMPLEMENTATIONS ====================
  /**
   * Find anime by external ID
   *
   * @param externalId - External ID (AniList ID)
   * @returns Anime with metadata or null
   * @override
   */
  async findByExternalId(externalId: number): Promise<AnimeItem | null> {
    return this.findOne({ where: { idAnilist: externalId } as any });
  }

  /**
   * Find multiple anime by external IDs
   * @param externalIds - Array of external IDs (AniList IDs)
   * @returns Array of anime with metadata
   * @override
   */
  async findManyByExternalIds(externalIds: number[]): Promise<AnimeItem[]> {
    return this.findMany({ where: { idAnilist: externalIds as any } });
  }

  /**
   * Count anime by search query
   *
   * @param filter - Filter with optional query
   * @returns Count of anime matching the query
   * @override
   */
  async countByQuery(filter: { query?: string }): Promise<number> {
    if (!filter.query) {
      return this.count();
    }
    const qb = this.repository.createQueryBuilder('anime');
    qb.where(
      'anime.titleRomaji LIKE :query OR anime.titleEnglish LIKE :query OR anime.titleNative LIKE :query',
      { query: `%${filter.query}%` }
    );
    return qb.getCount();
  }

  // ==================== PUBLIC API ====================
  /**
   * Find anime by AniList ID
   *
   * @param anilistId - AniList anime ID
   * @returns Anime with metadata or null
   */
  async findByAnilistId(anilistId: number): Promise<AnimeItem | null> {
    return this.findOne({ where: { idAnilist: anilistId } as any });
  }

  /**
   * Find multiple anime by AniList IDs
   *
   * @param anilistIds - Array of AniList IDs
   * @returns Array of anime with metadata
   */
  async findByAnilistIds(anilistIds: number[]): Promise<AnimeItem[]> {
    return this.findMany({ where: { idAnilist: anilistIds as any } });
  }

  /**
   * Create or update anime entry
   *
   * This method expects data already transformed by AnimeAdapter.
   * The adapter handles:
   * - Score normalization (0-100 → 0-10)
   * - Studio extraction
   * - Trailer URL building
   * - Field mapping
   *
   * @param transformedData - Data from AnimeAdapter.fromAnilist()
   * @returns Created or updated anime with metadata
   *
   * @example
   * // In service:
   * const anilistData = await anilistClient.fetchById(1);
   * const transformedData = animeAdapter.fromAnilist(anilistData);
   * const anime = await animeRepo.upsertAnime(transformedData);
   */
  async upsertAnime(transformedData: AnimeCreateData): Promise<AnimeItem> {
    const { idAnilist, ...fields } = transformedData;

    const existing = await this.findByAnilistId(idAnilist);

    if (!existing) {
      return this.create({ idAnilist, ...fields, lastSyncedAt: new Date() } as any);
    }

    const updated = await this.update(existing.id, { ...fields, lastSyncedAt: new Date() } as any);

    if (!updated) {
      throw new Error(`Failed to update anime with idAnilist: ${idAnilist}`);
    }

    return updated;
  }

  /**
   * Find anime by season
   *
   * @param season - Season (WINTER, SPRING, SUMMER, FALL)
   * @param year - Year
   * @returns Array of anime in the season
   */
  async findBySeason(season: string, year: number): Promise<AnimeItem[]> {
    return this.findMany({ where: { season, seasonYear: year } as any });
  }

  /**
   * Find anime by genre
   *
   * @param genre - Genre name
   * @returns Array of anime with the genre
   */
  async findByGenre(genre: string): Promise<AnimeItem[]> {
    const qb = this.repository.createQueryBuilder('anime');
    qb.where('JSON_CONTAINS(anime.genres, :genre)', { genre: JSON.stringify(genre) });
    return qb.getMany();
  }

  /**
   * Find currently airing anime
   *
   * @returns Array of airing anime
   */
  async findAiring(): Promise<AnimeItem[]> {
    return this.findMany({ where: { status: 'RELEASING' } as any });
  }

  /**
   * Find anime by studio
   *
   * @param studio - Studio name
   * @returns Array of anime by the studio
   */
  async findByStudio(studio: string): Promise<AnimeItem[]> {
    return this.findMany({ where: { studio } as any });
  }
}

export default AnimeRepository;
