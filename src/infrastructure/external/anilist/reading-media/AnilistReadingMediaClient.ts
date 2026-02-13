import { NotFoundError } from '../../../../shared/utils/error';
import logger from '../../../../shared/utils/logger';
import { MEDIA_STATISTICS_QS } from '../anilist.queries';
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
  // Format constants for filtering
  private static readonly MANGA_FORMATS: MediaFormat[] = ['MANGA', 'ONE_SHOT', 'MANHWA', 'MANHUA'];
  private static readonly NOVEL_FORMATS: MediaFormat[] = ['NOVEL', 'LIGHT_NOVEL'];

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
   * Search reading media by query string with optional format filtering
   *
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @param {MediaFormat[]} [options.formats] - Optional format filter
   * @param {number} [options.page] - Page number
   * @param {number} [options.perPage] - Results per page
   * @returns {Promise<{ pageInfo: PageInfo; media: ReadingMediaSearchResult[] }>} - Search results
   */
  async search(
    query: string,
    options: {
      formats?: MediaFormat[];
      page?: number;
      perPage?: number;
    } = {}
  ): Promise<{ pageInfo: PageInfo; media: ReadingMediaSearchResult[] }> {
    const { formats, page = 1, perPage = 20 } = options;

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

    return {
      pageInfo: data.Page?.pageInfo || ({} as PageInfo),
      media: data.Page?.media || [],
    };
  }

  /**
   * Search reading media by format group (convenience method)
   *
   * @param {string} query - Search query
   * @param {FormatGroup} formatGroup - 'manga' or 'novel'
   * @param {object} options - Pagination options
   * @returns {Promise<{ pageInfo: PageInfo; media: ReadingMediaSearchResult[] }>} - Search results
   */
  async searchByFormatGroup(
    query: string,
    formatGroup: FormatGroup,
    options: { page?: number; perPage?: number } = {}
  ): Promise<{ pageInfo: PageInfo; media: ReadingMediaSearchResult[] }> {
    const formats = this.getFormatsForGroup(formatGroup);
    return this.search(query, { ...options, formats });
  }

  /**
   * Search reading media by multiple criteria
   *
   * @param {object} criteria - Search criteria
   * @param {string[]} [criteria.genres] - Genre filters
   * @param {MediaFormat[]} [criteria.formats] - Format filters
   * @param {string} [criteria.status] - Status filter
   * @param {string} [criteria.countryOfOrigin] - Country filter
   * @param {object} options - Pagination and sorting options
   * @returns {Promise<{ pageInfo: PageInfo; media: ReadingMediaSearchByGenreResult[] }>} - Search results
   */
  async searchByCriteria(
    criteria: {
      genres?: string[];
      formats?: MediaFormat[];
      status?: string;
      countryOfOrigin?: string;
    } = {},
    options: { page?: number; perPage?: number; sort?: string[] } = {}
  ): Promise<{ pageInfo: PageInfo; media: ReadingMediaSearchByGenreResult[] }> {
    const { genres, formats, status, countryOfOrigin } = criteria;
    const { page = 1, perPage = 20, sort = ['POPULARITY_DESC'] } = options;

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

    return {
      pageInfo: data.Page?.pageInfo || ({} as PageInfo),
      media: data.Page?.media || [],
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
