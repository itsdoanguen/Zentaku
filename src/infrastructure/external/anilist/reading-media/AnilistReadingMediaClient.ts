import type ReadingMediaAdapter from '../../../../modules/reading-media/reading-media.adapter';
import type ReadingMediaRepository from '../../../../modules/reading-media/reading-media.repository';
import { NotFoundError } from '../../../../shared/utils/error';
import logger from '../../../../shared/utils/logger';
import { MEDIA_OVERVIEW_QS, MEDIA_STATISTICS_QS } from '../anilist.queries';
import type { MediaStatistics, PageInfo } from '../anilist.types';
import AnilistClient from '../AnilistClient';
import {
  READING_MEDIA_BATCH_INFO_QS,
  READING_MEDIA_COVERS_BATCH_QS,
  READING_MEDIA_ID_SEARCH_QS,
  READING_MEDIA_INFO_LIGHTWEIGHT_QS,
  READING_MEDIA_INFO_QS,
  READING_MEDIA_SEARCH_CRITERIA_QS,
} from './anilist-reading-media.queries';
import type {
  FormatGroup,
  MediaFormat,
  ReadingMediaBatchInfo,
  ReadingMediaBatchResponse,
  ReadingMediaCoversBatchResponse,
  ReadingMediaInfo,
  ReadingMediaInfoResponse,
  ReadingMediaLightweight,
  ReadingMediaLightweightResponse,
  ReadingMediaOverview,
  ReadingMediaOverviewResponse,
  ReadingMediaSearchByGenreResponse,
  ReadingMediaSearchByGenreResult,
  ReadingMediaSearchResponse,
  ReadingMediaSearchResult,
  ReadingMediaStatisticsResponse,
} from './anilist-reading-media.types';

/**
 * AniList Reading Media Client
 *
 * Unified client for both Manga and Novel reading media.
 * Uses format field for differentiation.
 *
 * @extends {AnilistClient}
 */
class AnilistReadingMediaClient extends AnilistClient {
  // Note: Manhwa (KR) and Manhua (CN/TW) use MANGA format with different countryOfOrigin
  private static readonly MANGA_FORMATS: MediaFormat[] = ['MANGA', 'ONE_SHOT'];
  private static readonly NOVEL_FORMATS: MediaFormat[] = ['NOVEL'];

  private readingMediaRepository?: ReadingMediaRepository;
  private readingMediaAdapter?: ReadingMediaAdapter;

  setRepositoryAndAdapter(repository: ReadingMediaRepository, adapter: ReadingMediaAdapter): void {
    this.readingMediaRepository = repository;
    this.readingMediaAdapter = adapter;
  }

  /**
   * Get formats array based on format group
   *
   * @param {FormatGroup} formatGroup - 'manga' or 'novel'
   * @returns {MediaFormat[]} - Array of formats
   */
  private getFormatsForGroup(formatGroup: FormatGroup): MediaFormat[] {
    return formatGroup === 'manga'
      ? AnilistReadingMediaClient.MANGA_FORMATS
      : AnilistReadingMediaClient.NOVEL_FORMATS;
  }

  /**
   * Fetch detailed reading media information by ID
   *
   * @param {number} mediaId - Media ID
   * @returns {Promise<ReadingMediaInfo>} - Reading media data
   * @throws {NotFoundError} - If media not found
   */
  async fetchById(mediaId: number): Promise<ReadingMediaInfo> {
    const data = await this.executeQuery<ReadingMediaInfoResponse>(
      READING_MEDIA_INFO_QS,
      { id: mediaId },
      `fetchReadingMediaById(${mediaId})`
    );

    if (!data?.Media) {
      throw new NotFoundError(`Reading media with ID ${mediaId} not found`);
    }

    return data.Media;
  }

  /**
   * Fetch lightweight reading media info (for lists/cards)
   *
   * @param {number} mediaId - Media ID
   * @returns {Promise<ReadingMediaLightweight>} - Lightweight media data
   * @throws {NotFoundError} - If not found
   */
  async fetchLightweight(mediaId: number): Promise<ReadingMediaLightweight> {
    const data = await this.executeQuery<ReadingMediaLightweightResponse>(
      READING_MEDIA_INFO_LIGHTWEIGHT_QS,
      { id: mediaId },
      `fetchReadingMediaLightweight(${mediaId})`
    );

    if (!data?.Media) {
      throw new NotFoundError(`Reading media with ID ${mediaId} not found`);
    }

    return data.Media;
  }

  /**
   * Fetch overview of reading media (relations, characters, staff, stats)
   *
   * @param {number} mediaId - Media ID
   * @returns {Promise<ReadingMediaOverview>} - Overview data
   * @throws {NotFoundError} - If not found
   */
  async fetchOverview(mediaId: number): Promise<ReadingMediaOverview> {
    const data = await this.executeQuery<ReadingMediaOverviewResponse>(
      MEDIA_OVERVIEW_QS,
      { id: mediaId, type: 'MANGA' },
      `fetchReadingMediaOverview(${mediaId})`
    );

    if (!data?.Media) {
      throw new NotFoundError(`Reading media with ID ${mediaId} not found`);
    }

    return data.Media;
  }

  /**
   * Fetch multiple reading media in batch (max 50)
   *
   * @param {number[]} mediaIds - Array of media IDs
   * @returns {Promise<Record<number, ReadingMediaBatchInfo>>} - Map of mediaId => media data
   */
  async fetchBatch(mediaIds: number[]): Promise<Record<number, ReadingMediaBatchInfo>> {
    if (!mediaIds || mediaIds.length === 0) {
      return {};
    }

    if (mediaIds.length > 50) {
      logger.warn(`fetchBatch called with ${mediaIds.length} IDs, limiting to 50`);
      mediaIds = mediaIds.slice(0, 50);
    }

    const data = await this.executeQuery<ReadingMediaBatchResponse>(
      READING_MEDIA_BATCH_INFO_QS,
      { ids: mediaIds },
      `fetchReadingMediaBatch(${mediaIds.length})`
    );

    const result: Record<number, ReadingMediaBatchInfo> = {};
    const mediaList = data.Page?.media || [];

    mediaList.forEach((media) => {
      if (media?.id) {
        result[media.id] = media;
      }
    });

    logger.debug(
      `fetchBatch: requested ${mediaIds.length}, received ${Object.keys(result).length}`
    );
    return result;
  }

  /**
   * Fetch cover images in batch
   *
   * @param {number[]} mediaIds - Array of media IDs
   * @returns {Promise<Record<number, string | null>>} - Map of mediaId => cover URL
   */
  async fetchCoversBatch(mediaIds: number[]): Promise<Record<number, string | null>> {
    if (!mediaIds || mediaIds.length === 0) {
      return {};
    }

    if (mediaIds.length > 50) {
      logger.warn(`fetchCoversBatch called with ${mediaIds.length} IDs, limiting to 50`);
      mediaIds = mediaIds.slice(0, 50);
    }

    const data = await this.executeQuery<ReadingMediaCoversBatchResponse>(
      READING_MEDIA_COVERS_BATCH_QS,
      { ids: mediaIds },
      `fetchReadingMediaCoversBatch(${mediaIds.length})`
    );

    const result: Record<number, string | null> = {};
    const mediaList = data.Page?.media || [];

    mediaList.forEach((media) => {
      if (media?.id) {
        result[media.id] = media.coverImage?.large || null;
      }
    });

    return result;
  }

  /**
   * Search reading media by query string with automatic caching
   *
   * @param {string} query - Search query
   * @param {object} options - Search options + cache options
   * @param {MediaFormat[]} [options.formats] - Optional format filter
   * @param {number} [options.page] - Page number
   * @param {number} [options.perPage] - Results per page
   * @param {number} [options.cacheTopResults] - Cache top N results (default: 5)
   * @param {boolean} [options.skipCache] - Skip caching step (default: false)
   * @returns {Promise<{ pageInfo: PageInfo; media: ReadingMediaSearchResult[]; cached?: number }>} - Search results with cache metadata
   */
  async search(
    query: string,
    options: {
      formats?: MediaFormat[];
      page?: number;
      perPage?: number;
      cacheTopResults?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<{
    pageInfo: PageInfo;
    media: ReadingMediaSearchResult[];
    cached?: number;
  }> {
    const { formats, page = 1, perPage = 20, cacheTopResults = 5, skipCache = false } = options;

    const data = await this.executeQuery<ReadingMediaSearchResponse>(
      READING_MEDIA_ID_SEARCH_QS,
      {
        query,
        page,
        perpage: perPage,
        format_in: formats || undefined,
      },
      `searchReadingMedia("${query}", formats: ${formats ? formats.join(',') : 'all'})`
    );

    const results = {
      pageInfo: data.Page?.pageInfo || ({} as PageInfo),
      media: data.Page?.media || [],
    };

    let cachedCount = 0;
    if (
      !skipCache &&
      this.readingMediaRepository &&
      this.readingMediaAdapter &&
      results.media.length > 0
    ) {
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
   * Search reading media by format group
   *
   * @param {string} query - Search query
   * @param {FormatGroup} formatGroup - 'manga' or 'novel'
   * @param {object} options - Pagination and cache options
   * @returns {Promise<{ pageInfo: PageInfo; media: ReadingMediaSearchResult[]; cached?: number }>} - Search results with cache metadata
   */
  async searchByFormatGroup(
    query: string,
    formatGroup: FormatGroup,
    options: {
      page?: number;
      perPage?: number;
      cacheTopResults?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<{
    pageInfo: PageInfo;
    media: ReadingMediaSearchResult[];
    cached?: number;
  }> {
    const formats = this.getFormatsForGroup(formatGroup);
    return this.search(query, { ...options, formats });
  }

  /**
   * Cache search results to database
   *
   * @private
   * @param {ReadingMediaSearchResult[]} results - Search results from AniList
   * @param {number} limit - Number of results to cache
   * @returns {Promise<number>} - Number of successfully cached items
   */
  private async _cacheSearchResults(
    results: ReadingMediaSearchResult[],
    limit: number
  ): Promise<number> {
    if (!this.readingMediaRepository || !this.readingMediaAdapter) {
      logger.warn('Cannot cache search results: repository or adapter not set');
      return 0;
    }

    const resultsToCache = results.slice(0, limit);
    let successCount = 0;

    for (const result of resultsToCache) {
      try {
        const entityData = this.readingMediaAdapter.fromExternal(result as ReadingMediaInfo);

        entityData.lastSyncedAt = new Date();

        await this.readingMediaRepository.upsertAnime(entityData);

        successCount++;
      } catch (error) {
        logger.warn('Failed to cache search result', {
          mediaId: result.id,
          error: (error as Error).message,
        });
      }
    }

    logger.info('Cached reading media search results', {
      total: resultsToCache.length,
      successful: successCount,
      failed: resultsToCache.length - successCount,
    });

    return successCount;
  }

  /**
   * Search reading media by multiple criteria with automatic caching
   *
   * @param {object} criteria - Search criteria
   * @param {string[]} [criteria.genres] - Genre filters
   * @param {MediaFormat[]} [criteria.formats] - Format filters
   * @param {string} [criteria.status] - Status filter
   * @param {string} [criteria.countryOfOrigin] - Country filter
   * @param {object} options - Pagination, sorting, and cache options
   * @returns {Promise<{ pageInfo: PageInfo; media: ReadingMediaSearchByGenreResult[]; cached?: number }>} - Search results with cache metadata
   */
  async searchByCriteria(
    criteria: {
      genres?: string[];
      formats?: MediaFormat[];
      status?: string;
      countryOfOrigin?: string;
    } = {},
    options: {
      page?: number;
      perPage?: number;
      sort?: string[];
      cacheTopResults?: number;
      skipCache?: boolean;
    } = {}
  ): Promise<{
    pageInfo: PageInfo;
    media: ReadingMediaSearchByGenreResult[];
    cached?: number;
  }> {
    const { genres, formats, status, countryOfOrigin } = criteria;
    const {
      page = 1,
      perPage = 20,
      sort = ['POPULARITY_DESC'],
      cacheTopResults = 5,
      skipCache = false,
    } = options;

    const data = await this.executeQuery<ReadingMediaSearchByGenreResponse>(
      READING_MEDIA_SEARCH_CRITERIA_QS,
      {
        genres,
        format_in: formats || undefined,
        status,
        countryOfOrigin,
        page,
        perpage: perPage,
        sort,
      },
      `searchReadingMediaByCriteria(formats: ${formats ? formats.join(',') : 'all'})`
    );

    const results = {
      pageInfo: data.Page?.pageInfo || ({} as PageInfo),
      media: data.Page?.media || [],
    };

    let cachedCount = 0;
    if (
      !skipCache &&
      this.readingMediaRepository &&
      this.readingMediaAdapter &&
      results.media.length > 0
    ) {
      cachedCount = await this._cacheSearchResults(
        results.media as unknown as ReadingMediaSearchResult[],
        Math.min(cacheTopResults, results.media.length)
      );
    }

    return {
      ...results,
      cached: cachedCount,
    };
  }

  /**
   * Search by criteria with format group (convenience method)
   *
   * @param {FormatGroup} formatGroup - 'manga' or 'novel'
   * @param {object} criteria - Search criteria (excluding formats)
   * @param {object} options - Pagination and sorting options
   * @returns {Promise<{ pageInfo: PageInfo; media: ReadingMediaSearchByGenreResult[] }>} - Search results
   */
  async searchByCriteriaWithFormatGroup(
    formatGroup: FormatGroup,
    criteria: {
      genres?: string[];
      status?: string;
      countryOfOrigin?: string;
    } = {},
    options: { page?: number; perPage?: number; sort?: string[] } = {}
  ): Promise<{ pageInfo: PageInfo; media: ReadingMediaSearchByGenreResult[] }> {
    const formats = this.getFormatsForGroup(formatGroup);
    return this.searchByCriteria({ ...criteria, formats }, options);
  }

  /**
   * Fetch statistics for reading media
   *
   * @param {number} mediaId - Media ID
   * @returns {Promise<MediaStatistics>} - Media statistics
   */
  async fetchStatistics(mediaId: number): Promise<MediaStatistics> {
    const data = await this.executeQuery<ReadingMediaStatisticsResponse>(
      MEDIA_STATISTICS_QS,
      { id: mediaId, type: 'MANGA' },
      `fetchReadingMediaStats(${mediaId})`
    );

    return data.Media;
  }
}

export default AnilistReadingMediaClient;
