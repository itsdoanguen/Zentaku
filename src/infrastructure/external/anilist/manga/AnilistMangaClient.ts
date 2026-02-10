import { NotFoundError } from '../../../../shared/utils/error';
import logger from '../../../../shared/utils/logger';
import { MEDIA_STATISTICS_QS } from '../anilist.queries';
import type { MediaStatistics, PageInfo } from '../anilist.types';
import AnilistClient from '../AnilistClient';
import {
  MANGA_BATCH_INFO_QS,
  MANGA_COVERS_BATCH_QS,
  MANGA_ID_SEARCH_QS,
  MANGA_INFO_LIGHTWEIGHT_QS,
  MANGA_INFO_QS,
  MANGA_SEARCH_CRITERIA_QS,
} from './anilist-manga.queries';
import type {
  MangaBatchInfo,
  MangaBatchResponse,
  MangaCoversBatchResponse,
  MangaInfo,
  MangaInfoResponse,
  MangaLightweight,
  MangaLightweightResponse,
  MangaSearchByGenreResponse,
  MangaSearchByGenreResult,
  MangaSearchResponse,
  MangaSearchResult,
  MangaStatisticsResponse,
} from './anilist-manga.types';

/**
 * AniList Manga Client
 *
 * @extends {AnilistClient}
 */
class AnilistMangaClient extends AnilistClient {
  /**
   * Fetch detailed manga information by ID
   *
   * @param {number} mangaId - Manga ID
   * @returns {Promise<MangaInfo>} - Manga data
   * @throws {NotFoundError} - If manga not found
   */
  async fetchById(mangaId: number): Promise<MangaInfo> {
    const data = await this.executeQuery<MangaInfoResponse>(
      MANGA_INFO_QS,
      { id: mangaId },
      `fetchMangaById(${mangaId})`
    );

    if (!data?.Media) {
      throw new NotFoundError(`Manga with ID ${mangaId} not found`);
    }

    return data.Media;
  }

  // Fetch lightweight manga info (for lists/cards). Throws NotFoundError if not found.
  async fetchLightweight(mangaId: number): Promise<MangaLightweight> {
    const data = await this.executeQuery<MangaLightweightResponse>(
      MANGA_INFO_LIGHTWEIGHT_QS,
      { id: mangaId },
      `fetchMangaLightweight(${mangaId})`
    );

    if (!data?.Media) {
      throw new NotFoundError(`Manga with ID ${mangaId} not found`);
    }

    return data.Media;
  }

  /**
   * Fetch multiple manga in batch (max 50)
   * @param mangaIds Array of manga IDs
   * @returns Map of mangaId => manga data
   */
  async fetchBatch(mangaIds: number[]): Promise<Record<number, MangaBatchInfo>> {
    if (!mangaIds || mangaIds.length === 0) {
      return {};
    }

    if (mangaIds.length > 50) {
      logger.warn(`fetchBatch called with ${mangaIds.length} IDs, limiting to 50`);
      mangaIds = mangaIds.slice(0, 50);
    }

    const data = await this.executeQuery<MangaBatchResponse>(
      MANGA_BATCH_INFO_QS,
      { ids: mangaIds },
      `fetchMangaBatch(${mangaIds.length})`
    );

    const result: Record<number, MangaBatchInfo> = {};
    const mediaList = data.Page?.media || [];

    mediaList.forEach((manga) => {
      if (manga?.id) {
        result[manga.id] = manga;
      }
    });

    logger.debug(
      `fetchBatch: requested ${mangaIds.length}, received ${Object.keys(result).length}`
    );
    return result;
  }

  async fetchCoversBatch(mangaIds: number[]): Promise<Record<number, string | null>> {
    if (!mangaIds || mangaIds.length === 0) {
      return {};
    }

    if (mangaIds.length > 50) {
      logger.warn(`fetchCoversBatch called with ${mangaIds.length} IDs, limiting to 50`);
      mangaIds = mangaIds.slice(0, 50);
    }

    const data = await this.executeQuery<MangaCoversBatchResponse>(
      MANGA_COVERS_BATCH_QS,
      { ids: mangaIds },
      `fetchMangaCoversBatch(${mangaIds.length})`
    );

    const result: Record<number, string | null> = {};
    const mediaList = data.Page?.media || [];

    mediaList.forEach((manga) => {
      if (manga?.id) {
        result[manga.id] = manga.coverImage?.large || null;
      }
    });

    return result;
  }

  /**
   * Search manga by query string
   *
   * @param {string} query - Search query
   * @param {object} options - Pagination options
   * @returns {Promise<{ pageInfo: PageInfo; media: MangaSearchResult[] }>} - Search results with pageInfo and media
   */
  async search(
    query: string,
    options: { page?: number; perPage?: number } = {}
  ): Promise<{ pageInfo: PageInfo; media: MangaSearchResult[] }> {
    const { page = 1, perPage = 20 } = options;

    const data = await this.executeQuery<MangaSearchResponse>(
      MANGA_ID_SEARCH_QS,
      { query, page, perpage: perPage },
      `searchManga("${query}")`
    );

    return {
      pageInfo: data.Page?.pageInfo || ({} as PageInfo),
      media: data.Page?.media || [],
    };
  }

  /**
   * Search manga by multiple criteria
   *
   * @param {object} criteria - Search criteria
   * @param {object} options - Pagination and sorting options
   * @returns {Promise<{ pageInfo: PageInfo; media: MangaSearchByGenreResult[] }>} - Search results with pageInfo and media
   */
  async searchByCriteria(
    criteria: {
      genres?: string[];
      format?: string;
      status?: string;
      countryOfOrigin?: string;
    } = {},
    options: { page?: number; perPage?: number; sort?: string[] } = {}
  ): Promise<{ pageInfo: PageInfo; media: MangaSearchByGenreResult[] }> {
    const { genres, format, status, countryOfOrigin } = criteria;
    const { page = 1, perPage = 20, sort = ['POPULARITY_DESC'] } = options;

    const data = await this.executeQuery<MangaSearchByGenreResponse>(
      MANGA_SEARCH_CRITERIA_QS,
      { genres, format, status, countryOfOrigin, page, perpage: perPage, sort },
      `searchMangaByCriteria()`
    );

    return {
      pageInfo: data.Page?.pageInfo || ({} as PageInfo),
      media: data.Page?.media || [],
    };
  }

  async fetchStatistics(mangaId: number): Promise<MediaStatistics> {
    const data = await this.executeQuery<MangaStatisticsResponse>(
      MEDIA_STATISTICS_QS,
      { id: mangaId, type: 'MANGA' },
      `fetchMangaStats(${mangaId})`
    );

    return data.Media;
  }
}

export default AnilistMangaClient;
