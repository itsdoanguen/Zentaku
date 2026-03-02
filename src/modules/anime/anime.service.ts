import type { ExternalIdField, MediaType } from '../../core/base/BaseMediaService';
import { BaseMediaService } from '../../core/base/BaseMediaService';
import type AnilistAnimeClient from '../../infrastructure/external/anilist/anime/AnilistAnimeClient';
import type AnilistCharacterClient from '../../infrastructure/external/anilist/character/AnilistCharacterClient';
import type AnilistStaffClient from '../../infrastructure/external/anilist/staff/AnilistStaffClient';
import type AnimeAdapter from './anime.adapter';
import type AnimeRepository from './anime.repository';

/**
 * Anime Service
 * Business logic layer for anime operations
 *
 * Extends BaseMediaService with anime-specific implementations
 * Uses dependency injection for better testability
 *
 * @extends BaseMediaService
 */
class AnimeService extends BaseMediaService {
  protected override readonly dbRepository: AnimeRepository;
  protected override readonly externalClient: AnilistAnimeClient;
  protected override readonly adapter: AnimeAdapter;
  protected override readonly characterClient?: AnilistCharacterClient;
  protected override readonly staffClient?: AnilistStaffClient;

  /**
   * Constructor with dependency injection
   *
   * @param animeRepository - Anime database repository
   * @param animeAdapter - Anime data adapter
   * @param anilistAnimeClient - AniList API client
   * @param anilistCharacterClient - Optional AniList Character client
   * @param anilistStaffClient - Optional AniList Staff client
   */
  constructor(
    animeRepository: AnimeRepository,
    animeAdapter: AnimeAdapter,
    anilistAnimeClient: AnilistAnimeClient,
    anilistCharacterClient?: AnilistCharacterClient,
    anilistStaffClient?: AnilistStaffClient
  ) {
    super(
      animeRepository,
      anilistAnimeClient,
      animeAdapter,
      anilistCharacterClient,
      anilistStaffClient
    );
    this.dbRepository = animeRepository;
    this.externalClient = anilistAnimeClient;
    this.adapter = animeAdapter;
    this.characterClient = anilistCharacterClient;
    this.staffClient = anilistStaffClient;
  }

  // ==================== ABSTRACT METHOD IMPLEMENTATIONS ====================

  /**
   * Get media type identifier
   *
   * @returns ANIME
   * @override
   */
  getMediaType(): MediaType {
    return 'ANIME';
  }

  /**
   * Get external ID field name
   *
   * @returns idAnilist
   * @override
   */
  getExternalIdField(): ExternalIdField {
    return 'idAnilist';
  }

  // ==================== PUBLIC API ====================

  /**
   * Get anime details by Anilist ID.
   * Delegates to base class getDetails() template method
   *
   * @param anilistId - The Anilist ID of the anime
   * @returns Formatted anime details
   */
  async getAnimeDetails(anilistId: number): Promise<unknown> {
    return this.getDetails(anilistId);
  }

  /**
   * Get anime overview data
   * Includes: relations, characters/staff preview, stats, rankings, recommendations
   *
   * @param anilistId - The Anilist ID of the anime
   * @returns Anime overview data
   */
  async getAnimeOverview(anilistId: number): Promise<unknown> {
    return this.getOverview(anilistId);
  }

  /**
   * Get characters for anime with pagination
   *
   * @param anilistId - The Anilist ID of the anime
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 25)
   * @returns Characters data with pagination
   */
  async getAnimeCharacters(
    anilistId: number,
    page: number = 1,
    perPage: number = 25
  ): Promise<unknown> {
    return this.getCharacters(anilistId, page, perPage);
  }

  /**
   * Get staff for anime with pagination
   *
   * @param anilistId - The Anilist ID of the anime
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 25)
   * @returns Staff data with pagination
   */
  async getAnimeStaff(anilistId: number, page: number = 1, perPage: number = 25): Promise<unknown> {
    return this.getStaff(anilistId, page, perPage);
  }

  /**
   * Get statistics for anime
   * Includes: rankings, score distribution, status distribution
   *
   * @param anilistId - The Anilist ID of the anime
   * @returns Anime statistics
   */
  async getAnimeStatistics(anilistId: number): Promise<unknown> {
    return this.getStatistics(anilistId);
  }

  /**
   * Get streaming platforms information for anime
   * Anime-specific feature - returns list of platforms where anime can be watched
   *
   * @param anilistId - The Anilist ID of the anime
   * @returns Streaming episodes data
   */
  async getWhereToWatch(anilistId: number): Promise<unknown> {
    const context = `getWhereToWatch(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'Anime ID');

      this._logInfo('Fetching anime streaming platforms', { anilistId });

      const streamingData = await this.externalClient.fetchWhereToWatch(anilistId);

      this._logInfo('Successfully fetched streaming platforms', {
        anilistId,
        platformCount: streamingData.length,
      });

      return streamingData;
    }, context);
  }

  /**
   * Search anime from external API
   *
   * @internal
   * @param query - Search query string
   * @param options - Search options with cache settings
   * @returns Search results with cache metadata
   */
  async searchExternal(
    query: string,
    options: {
      page?: number;
      perPage?: number;
      skipCache?: boolean;
      cacheTopResults?: number;
    } = {}
  ): Promise<{
    items: unknown[];
    pageInfo: unknown;
    cached?: number;
  }> {
    const context = 'searchExternal()';
    const { page = 1, perPage = 20, skipCache = false, cacheTopResults = 5 } = options;

    return this._executeWithErrorHandling(async () => {
      this._logInfo('Searching anime on external API', { query, page, perPage, skipCache });

      const results = await this.externalClient.search(query, {
        page,
        perPage,
        skipCache,
        cacheTopResults,
      });

      this._logInfo('External search completed', {
        resultsCount: results.media.length,
        cached: results.cached || 0,
      });

      return {
        items: results.media,
        pageInfo: results.pageInfo,
        cached: results.cached,
      };
    }, context);
  }

  /**
   * Search anime by criteria
   *
   * @internal
   * @param criteria - Search criteria (genres, season, format, status)
   * @param options - Pagination, sorting, and cache options
   * @returns Search results with cache metadata
   */
  async searchByCriteria(
    criteria: {
      genres?: string[];
      season?: string;
      seasonYear?: number;
      format?: string;
      status?: string;
    },
    options: {
      page?: number;
      perPage?: number;
      sort?: string[];
      skipCache?: boolean;
      cacheTopResults?: number;
    } = {}
  ): Promise<{ items: unknown[]; pageInfo: unknown; cached?: number }> {
    const context = 'searchByCriteria()';
    const {
      page = 1,
      perPage = 20,
      sort = ['POPULARITY_DESC'],
      skipCache = false,
      cacheTopResults = 5,
    } = options;

    return this._executeWithErrorHandling(async () => {
      this._logInfo('Searching anime by criteria', { criteria, page, perPage });

      const results = await this.externalClient.searchByCriteria(criteria, {
        page,
        perPage,
        sort,
        skipCache,
        cacheTopResults,
      });

      return {
        items: results.media,
        pageInfo: results.pageInfo,
        cached: results.cached,
      };
    }, context);
  }

  /**
   * Get seasonal anime (for Search Module use)
   *
   * @internal
   * @param season - Season (WINTER, SPRING, SUMMER, FALL)
   * @param seasonYear - Year
   * @param options - Pagination and sorting options
   * @returns Seasonal anime results
   */
  async getSeasonal(
    season: string,
    seasonYear: number,
    options: { page?: number; perPage?: number; sort?: string[] } = {}
  ): Promise<{ items: unknown[]; pageInfo: unknown }> {
    const context = 'getSeasonal()';
    const { page = 1, perPage = 20, sort = ['POPULARITY_DESC'] } = options;

    return this._executeWithErrorHandling(async () => {
      this._logInfo('Fetching seasonal anime', { season, seasonYear, page, perPage });

      const results = await this.externalClient.fetchSeasonal(season, seasonYear, {
        page,
        perPage,
        sort,
      });

      return {
        items: results.media,
        pageInfo: results.pageInfo,
      };
    }, context);
  }
}

export default AnimeService;
