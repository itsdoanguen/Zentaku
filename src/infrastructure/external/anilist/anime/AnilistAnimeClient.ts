import type AnimeAdapter from '../../../../modules/anime/anime.adapter';
import type AnimeRepository from '../../../../modules/anime/anime.repository';
import { NotFoundError } from '../../../../shared/utils/error';
import logger from '../../../../shared/utils/logger';
import { MEDIA_OVERVIEW_QS, MEDIA_STATISTICS_QS } from '../anilist.queries';
import type { MediaStatistics, PageInfo } from '../anilist.types';
import AnilistClient from '../AnilistClient';
import {
  ANIME_BATCH_INFO_QS,
  ANIME_COVERS_BATCH_QS,
  ANIME_ID_SEARCH_QS,
  ANIME_INFO_LIGHTWEIGHT_QS,
  ANIME_INFO_QS,
  ANIME_SEARCH_CRITERIA_QS,
  ANIME_SEASON_TREND_QS,
  ANIME_WHERE_TO_WATCH_QS,
} from './anilist-anime.queries';
import type {
  AnimeBatchInfo,
  AnimeBatchResponse,
  AnimeCoversBatchResponse,
  AnimeInfo,
  AnimeInfoResponse,
  AnimeLightweight,
  AnimeLightweightResponse,
  AnimeOverview,
  AnimeOverviewResponse,
  AnimeSearchResponse,
  AnimeSearchResult,
  AnimeSeasonalResponse,
  AnimeSeasonalResult,
  AnimeStatisticsResponse,
  StreamingEpisode,
  StreamingEpisodesResponse,
} from './anilist-anime.types';

/**
 * AniList Anime Client
 *
 * @extends {AnilistClient}
 */
class AnilistAnimeClient extends AnilistClient {
  private animeRepository?: AnimeRepository;
  private animeAdapter?: AnimeAdapter;

  setRepositoryAndAdapter(repository: AnimeRepository, adapter: AnimeAdapter): void {
    this.animeRepository = repository;
    this.animeAdapter = adapter;
  }
  /**
   * Fetch detailed anime information by ID
   *
   * @param {number} animeId - Anime ID
   * @returns {Promise<AnimeInfo>} - Anime data
   * @throws {NotFoundError} - If anime not found
   */
  async fetchById(animeId: number): Promise<AnimeInfo> {
    const data = await this.executeQuery<AnimeInfoResponse>(
      ANIME_INFO_QS,
      { id: animeId },
      `fetchAnimeById(${animeId})`
    );

    if (!data?.Media) {
      throw new NotFoundError(`Anime with ID ${animeId} not found`);
    }

    return data.Media;
  }

  /**
   * Fetch lightweight anime info (for lists/cards)
   *
   * @param {number} animeId - Anime ID
   * @returns {Promise<AnimeLightweight>} - Basic anime data
   * @throws {NotFoundError} - If anime not found
   */
  async fetchLightweight(animeId: number): Promise<AnimeLightweight> {
    const data = await this.executeQuery<AnimeLightweightResponse>(
      ANIME_INFO_LIGHTWEIGHT_QS,
      { id: animeId },
      `fetchAnimeLightweight(${animeId})`
    );

    if (!data?.Media) {
      throw new NotFoundError(`Anime with ID ${animeId} not found`);
    }

    return data.Media;
  }

  async fetchOverview(animeId: number): Promise<AnimeOverview> {
    const data = await this.executeQuery<AnimeOverviewResponse>(
      MEDIA_OVERVIEW_QS,
      { id: animeId, type: 'ANIME' },
      `fetchAnimeOverview(${animeId})`
    );

    if (!data?.Media) {
      throw new NotFoundError(`Anime with ID ${animeId} not found`);
    }

    return data.Media;
  }

  /**
   * Fetch multiple anime in batch (max 50)
   *
   * @param {number[]} animeIds - Array of anime IDs
   * @returns {Promise<Record<number, AnimeBatchInfo>>} - Map of animeId => anime data
   */
  async fetchBatch(animeIds: number[]): Promise<Record<number, AnimeBatchInfo>> {
    if (!animeIds || animeIds.length === 0) {
      return {};
    }

    if (animeIds.length > 50) {
      logger.warn(`fetchBatch called with ${animeIds.length} IDs, limiting to 50`);
      animeIds = animeIds.slice(0, 50);
    }

    const data = await this.executeQuery<AnimeBatchResponse>(
      ANIME_BATCH_INFO_QS,
      { ids: animeIds },
      `fetchAnimeBatch(${animeIds.length})`
    );

    const result: Record<number, AnimeBatchInfo> = {};
    const mediaList = data.Page?.media || [];

    mediaList.forEach((anime) => {
      if (anime?.id) {
        result[anime.id] = anime;
      }
    });

    logger.debug(
      `fetchBatch: requested ${animeIds.length}, received ${Object.keys(result).length}`
    );
    return result;
  }

  async fetchCoversBatch(animeIds: number[]): Promise<Record<number, string | null>> {
    if (!animeIds || animeIds.length === 0) {
      return {};
    }

    if (animeIds.length > 50) {
      logger.warn(`fetchCoversBatch called with ${animeIds.length} IDs, limiting to 50`);
      animeIds = animeIds.slice(0, 50);
    }

    const data = await this.executeQuery<AnimeCoversBatchResponse>(
      ANIME_COVERS_BATCH_QS,
      { ids: animeIds },
      `fetchAnimeCoversBatch(${animeIds.length})`
    );

    const result: Record<number, string | null> = {};
    const mediaList = data.Page?.media || [];

    mediaList.forEach((anime) => {
      if (anime?.id) {
        result[anime.id] = anime.coverImage?.large || null;
      }
    });

    return result;
  }

  /**
   * Search anime by query string
   *
   * @param {string} query - Search query
   * @param {object} options - Pagination options
   * @returns {Promise<{ pageInfo: PageInfo; media: AnimeSearchResult[] }>} - Search results with pageInfo and media
   */
  async search(
    query: string,
    options: { page?: number; perPage?: number } = {}
  ): Promise<{ pageInfo: PageInfo; media: AnimeSearchResult[] }> {
    const { page = 1, perPage = 20 } = options;

    const data = await this.executeQuery<AnimeSearchResponse>(
      ANIME_ID_SEARCH_QS,
      { query, page, perpage: perPage },
      `searchAnime("${query}")`
    );

    return {
      pageInfo: data.Page?.pageInfo || ({} as PageInfo),
      media: data.Page?.media || [],
    };
  }

  /**
   * Search anime with automatic caching
   *
   * @param {string} query - Search query
   * @param {object} options - Search options + cache options
   * @returns {Promise<{ pageInfo: PageInfo; media: AnimeSearchResult[]; cached?: number }>} - Search results with cache metadata
   */
  async searchWithCache(
    query: string,
    options: {
      page?: number;
      perPage?: number;
      cacheTopResults?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<{
    pageInfo: PageInfo;
    media: AnimeSearchResult[];
    cached?: number;
  }> {
    const { page = 1, perPage = 20, cacheTopResults = 5, skipCache = false } = options;

    const results = await this.search(query, { page, perPage });

    let cachedCount = 0;
    if (!skipCache && this.animeRepository && this.animeAdapter && results.media.length > 0) {
      cachedCount = await this._cacheSearchResults(
        results.media,
        Math.min(cacheTopResults, results.media.length)
      );
    }

    return {
      ...results,
      cached: cachedCount,
    };
  }

  /**
   * Cache search results to database
   *
   * @private
   * @param {AnimeSearchResult[]} results - Search results from AniList
   * @param {number} limit - Number of results to cache
   * @returns {Promise<number>} - Number of successfully cached items
   */
  private async _cacheSearchResults(results: AnimeSearchResult[], limit: number): Promise<number> {
    if (!this.animeRepository || !this.animeAdapter) {
      logger.warn('Cannot cache search results: repository or adapter not set');
      return 0;
    }

    const resultsToCache = results.slice(0, limit);
    let successCount = 0;

    for (const result of resultsToCache) {
      try {
        const entityData = this.animeAdapter.fromExternal(result as AnimeInfo);

        entityData.lastSyncedAt = new Date();

        await this.animeRepository.upsertAnime(entityData);

        successCount++;
      } catch (error) {
        logger.warn('Failed to cache search result', {
          animeId: result.id,
          error: (error as Error).message,
        });
      }
    }

    logger.info('Cached search results', {
      total: resultsToCache.length,
      successful: successCount,
      failed: resultsToCache.length - successCount,
    });

    return successCount;
  }

  /**
   * Fetch seasonal anime
   *
   * @param {string} season - Season (WINTER, SPRING, SUMMER, FALL)
   * @param {number} seasonYear - Year
   * @param {object} options - Pagination and sorting options
   * @returns {Promise<{ pageInfo: PageInfo; media: AnimeSeasonalResult[] }>} - Seasonal anime with pageInfo
   */
  async fetchSeasonal(
    season: string,
    seasonYear: number,
    options: { page?: number; perPage?: number; sort?: string[] } = {}
  ): Promise<{ pageInfo: PageInfo; media: AnimeSeasonalResult[] }> {
    const { page = 1, perPage = 20, sort = ['POPULARITY_DESC'] } = options;

    const data = await this.executeQuery<AnimeSeasonalResponse>(
      ANIME_SEASON_TREND_QS,
      { season, seasonYear, page, perpage: perPage, sort },
      `fetchSeasonalAnime(${season} ${seasonYear})`
    );

    return {
      pageInfo: data.Page?.pageInfo || ({} as PageInfo),
      media: data.Page?.media || [],
    };
  }

  /**
   * Search anime by multiple criteria
   * @param criteria Search criteria
   * @param options Pagination and sorting options
   * @returns Search results with pageInfo and media
   */
  async searchByCriteria(
    criteria: {
      genres?: string[];
      season?: string;
      seasonYear?: number;
      format?: string;
      status?: string;
    } = {},
    options: { page?: number; perPage?: number; sort?: string[] } = {}
  ): Promise<{ pageInfo: PageInfo; media: AnimeSeasonalResult[] }> {
    const { genres, season, seasonYear, format, status } = criteria;
    const { page = 1, perPage = 20, sort = ['POPULARITY_DESC'] } = options;

    const data = await this.executeQuery<AnimeSeasonalResponse>(
      ANIME_SEARCH_CRITERIA_QS,
      { genres, season, seasonYear, format, status, page, perpage: perPage, sort },
      `searchAnimeByCriteria()`
    );

    return {
      pageInfo: data.Page?.pageInfo || ({} as PageInfo),
      media: data.Page?.media || [],
    };
  }

  // Fetch statistics for an anime
  async fetchStatistics(animeId: number): Promise<MediaStatistics> {
    const data = await this.executeQuery<AnimeStatisticsResponse>(
      MEDIA_STATISTICS_QS,
      { id: animeId, type: 'ANIME' },
      `fetchAnimeStats(${animeId})`
    );

    return data.Media;
  }

  // Fetch streaming platforms information
  async fetchWhereToWatch(animeId: number): Promise<StreamingEpisode[]> {
    const data = await this.executeQuery<StreamingEpisodesResponse>(
      ANIME_WHERE_TO_WATCH_QS,
      { id: animeId },
      `fetchWhereToWatch(${animeId})`
    );

    return data.Media?.streamingEpisodes || [];
  }
}

export default AnilistAnimeClient;
