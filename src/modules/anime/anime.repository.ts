import type { AnimeMetadata, MediaItem, PrismaClient } from '@prisma/client';
import { BaseMediaRepository } from '../../core/base/BaseMediaRepository';
import type { FindOneOptions } from '../../core/types/repository';

/**
 * MediaItem with AnimeMetadata relation
 */
interface MediaItemWithAnimeMetadata extends MediaItem {
  animeMetadata: AnimeMetadata | null;
}

/**
 * Anime create/update data structure
 */
interface AnimeCreateData {
  idAnilist: number;
  idMal: number | null;
  lastSyncedAt: Date;
  titleRomaji: string;
  titleEnglish: string | null;
  titleNative: string | null;
  type: 'ANIME';
  status: 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED';
  coverImage: string | null;
  bannerImage: string | null;
  isAdult: boolean;
  averageScore: number | null;
  meanScore: number | null;
  description: string | null;
  synonyms: string[] | null;
  genres: string[] | null;
  tags: unknown[] | null;
  popularity: number | null;
  favorites: number | null;
  animeMetadata: {
    create: {
      episodeCount: number | null;
      durationMin: number | null;
      season: string | null;
      seasonYear: number | null;
      studio: string | null;
      source: string | null;
      trailerUrl: string | null;
      nextAiringEpisode: object | null;
    };
  };
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
class AnimeRepository extends BaseMediaRepository<MediaItemWithAnimeMetadata> {
  /**
   * Create anime repository instance
   *
   * @param prisma - Prisma client instance (injected by DI container)
   */
  constructor(prisma: PrismaClient) {
    super(prisma, 'animeMetadata');
  }

  // ==================== IMediaRepository IMPLEMENTATIONS ====================
  /**
   * Find anime by external ID
   *
   * @param externalId - External ID (AniList ID)
   * @returns Anime with metadata or null
   * @override
   */
  async findByExternalId(externalId: number): Promise<MediaItemWithAnimeMetadata | null> {
    return this._findByExternalId('idAnilist', externalId, {
      include: this._getDefaultInclude(),
    });
  }

  /**
   * Find multiple anime by external IDs
   * @param externalIds - Array of external IDs (AniList IDs)
   * @returns Array of anime with metadata
   * @override
   */
  async findManyByExternalIds(externalIds: number[]): Promise<MediaItemWithAnimeMetadata[]> {
    return this.findMany({
      where: {
        idAnilist: { in: externalIds },
      },
      include: this._getDefaultInclude(),
    }) as Promise<MediaItemWithAnimeMetadata[]>;
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
      return this.count({ where: { type: 'ANIME' } });
    }
    return this.count({
      where: {
        type: 'ANIME',
        OR: [
          { titleRomaji: { contains: filter.query, mode: 'insensitive' } },
          { titleEnglish: { contains: filter.query, mode: 'insensitive' } },
          { titleNative: { contains: filter.query, mode: 'insensitive' } },
        ],
      },
    });
  }

  // ==================== PUBLIC API ====================
  /**
   * Find anime by AniList ID
   *
   * @param anilistId - AniList anime ID
   * @param options - Query options
   * @returns Anime with metadata or null
   */
  async findByAnilistId(
    anilistId: number,
    options: FindOneOptions = {}
  ): Promise<MediaItemWithAnimeMetadata | null> {
    return this._findByExternalId('idAnilist', anilistId, options);
  }

  /**
   * Find multiple anime by AniList IDs
   *
   * @param anilistIds - Array of AniList IDs
   * @param options - Query options
   * @returns Array of anime with metadata
   */
  async findByAnilistIds(
    anilistIds: number[],
    options: FindOneOptions = {}
  ): Promise<MediaItemWithAnimeMetadata[]> {
    return this._findByExternalIds('idAnilist', anilistIds, options);
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
  async upsertAnime(transformedData: AnimeCreateData): Promise<MediaItemWithAnimeMetadata> {
    const { idAnilist, animeMetadata, ...coreFields } = transformedData;

    return this.upsert(
      { idAnilist },
      {
        ...coreFields,
        idAnilist,
        type: 'ANIME',
        lastSyncedAt: new Date(),
        animeMetadata: {
          create: animeMetadata.create,
        },
      } as any,
      {
        ...coreFields,
        lastSyncedAt: new Date(),
        animeMetadata: {
          upsert: {
            create: animeMetadata.create,
            update: animeMetadata.create,
          },
        },
      } as any,
      {
        include: this._getDefaultInclude(),
      }
    ) as Promise<MediaItemWithAnimeMetadata>;
  }

  /**
   * Find anime by season
   *
   * @param season - Season (WINTER, SPRING, SUMMER, FALL)
   * @param year - Year
   * @param options - Query options
   * @returns Array of anime in the season
   */
  async findBySeason(
    season: string,
    year: number,
    options: FindOneOptions = {}
  ): Promise<MediaItemWithAnimeMetadata[]> {
    return this.findMany({
      where: {
        type: 'ANIME',
        animeMetadata: {
          season,
          seasonYear: year,
        },
      },
      ...this._mergeWithDefaultInclude(options),
    }) as Promise<MediaItemWithAnimeMetadata[]>;
  }

  /**
   * Find anime by genre
   *
   * @param genre - Genre name
   * @param options - Query options
   * @returns Array of anime with the genre
   */
  async findByGenre(
    genre: string,
    options: FindOneOptions = {}
  ): Promise<MediaItemWithAnimeMetadata[]> {
    return this.findMany({
      where: {
        type: 'ANIME',
        genres: {
          array_contains: genre,
        },
      },
      ...this._mergeWithDefaultInclude(options),
    }) as Promise<MediaItemWithAnimeMetadata[]>;
  }

  /**
   * Find currently airing anime
   *
   * @param options - Query options
   * @returns Array of airing anime
   */
  async findAiring(options: FindOneOptions = {}): Promise<MediaItemWithAnimeMetadata[]> {
    return this.findMany({
      where: {
        type: 'ANIME',
        status: 'RELEASING',
      },
      ...this._mergeWithDefaultInclude(options),
    }) as Promise<MediaItemWithAnimeMetadata[]>;
  }

  /**
   * Find anime by studio
   *
   * @param studio - Studio name
   * @param options - Query options
   * @returns Array of anime by the studio
   */
  async findByStudio(
    studio: string,
    options: FindOneOptions = {}
  ): Promise<MediaItemWithAnimeMetadata[]> {
    return this.findMany({
      where: {
        type: 'ANIME',
        animeMetadata: {
          studio,
        },
      },
      ...this._mergeWithDefaultInclude(options),
    }) as Promise<MediaItemWithAnimeMetadata[]>;
  }
}

export default AnimeRepository;
