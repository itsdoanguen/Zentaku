import { NotFoundError } from '../../../shared/utils/error';
import logger from '../../../shared/utils/logger';
import {
  ANIME_BATCH_INFO_QS,
  ANIME_CHARACTERS_QS,
  ANIME_COVERS_BATCH_QS,
  ANIME_ID_SEARCH_QS,
  ANIME_INFO_LIGHTWEIGHT_QS,
  ANIME_INFO_QS,
  ANIME_SEARCH_CRITERIA_QS,
  ANIME_SEASON_TREND_QS,
  ANIME_STAFF_QS,
  ANIME_STATS_QS,
  ANIME_WHERE_TO_WATCH_QS,
  CHARACTER_INFO_QS,
  STAFF_INFO_QS,
} from './anilist.queries';
import type {
  AnimeBatchInfo,
  AnimeBatchResponse,
  AnimeCoversBatchResponse,
  AnimeInfo,
  AnimeInfoResponse,
  AnimeLightweight,
  AnimeLightweightResponse,
  AnimeSearchResponse,
  AnimeSearchResult,
  AnimeSeasonalResponse,
  AnimeSeasonalResult,
  AnimeStatistics,
  AnimeStatisticsResponse,
  CharacterEdge,
  CharacterInfo,
  CharacterInfoResponse,
  CharactersResponse,
  PageInfo,
  StaffEdge,
  StaffInfo,
  StaffInfoResponse,
  StaffResponse,
  StreamingEpisode,
  StreamingEpisodesResponse,
} from './anilist.types';
import AnilistClient from './AnilistClient';

/**
 * AniList Anime Client
 * Handles all anime-specific operations
 *
 * @extends {AnilistClient}
 */
class AnilistAnimeClient extends AnilistClient {
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

  /**
   * Fetch cover images in batch
   *
   * @param {number[]} animeIds - Array of anime IDs
   * @returns {Promise<Record<number, string | null>>} - Map of animeId => cover URL
   */
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
   *
   * @param {object} criteria - Search criteria
   * @param {object} options - Pagination and sorting options
   * @returns {Promise<{ pageInfo: PageInfo; media: AnimeSeasonalResult[] }>} - Search results with pageInfo and media
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

  /**
   * Fetch characters for an anime
   *
   * @param {number} animeId - Anime ID
   * @param {object} options - Pagination options
   * @returns {Promise<{ pageInfo: PageInfo; edges: CharacterEdge[] }>} - Characters with pageInfo and edges
   */
  async fetchCharacters(
    animeId: number,
    options: { page?: number; perPage?: number } = {}
  ): Promise<{ pageInfo: PageInfo; edges: CharacterEdge[] }> {
    const { page = 1, perPage = 10 } = options;

    const data = await this.executeQuery<CharactersResponse>(
      ANIME_CHARACTERS_QS,
      { id: animeId, page, perpage: perPage },
      `fetchAnimeCharacters(${animeId})`
    );

    return {
      pageInfo: data.Media?.characters?.pageInfo || ({} as PageInfo),
      edges: data.Media?.characters?.edges || [],
    };
  }

  /**
   * Fetch staff for an anime
   *
   * @param {number} animeId - Anime ID
   * @param {object} options - Pagination options
   * @returns {Promise<{ pageInfo: PageInfo; edges: StaffEdge[] }>} - Staff with pageInfo and edges
   */
  async fetchStaff(
    animeId: number,
    options: { page?: number; perPage?: number } = {}
  ): Promise<{ pageInfo: PageInfo; edges: StaffEdge[] }> {
    const { page = 1, perPage = 10 } = options;

    const data = await this.executeQuery<StaffResponse>(
      ANIME_STAFF_QS,
      { id: animeId, page, perpage: perPage },
      `fetchAnimeStaff(${animeId})`
    );

    return {
      pageInfo: data.Media?.staff?.pageInfo || ({} as PageInfo),
      edges: data.Media?.staff?.edges || [],
    };
  }

  /**
   * Fetch statistics for an anime
   *
   * @param {number} animeId - Anime ID
   * @returns {Promise<AnimeStatistics>} - Anime statistics
   */
  async fetchStatistics(animeId: number): Promise<AnimeStatistics> {
    const data = await this.executeQuery<AnimeStatisticsResponse>(
      ANIME_STATS_QS,
      { id: animeId },
      `fetchAnimeStats(${animeId})`
    );

    return data.Media;
  }

  /**
   * Fetch streaming platforms information
   *
   * @param {number} animeId - Anime ID
   * @returns {Promise<StreamingEpisode[]>} - Streaming platform information
   */
  async fetchWhereToWatch(animeId: number): Promise<StreamingEpisode[]> {
    const data = await this.executeQuery<StreamingEpisodesResponse>(
      ANIME_WHERE_TO_WATCH_QS,
      { id: animeId },
      `fetchWhereToWatch(${animeId})`
    );

    return data.Media?.streamingEpisodes || [];
  }

  /**
   * Fetch detailed character information by ID
   *
   * @param {number} characterId - Character ID
   * @returns {Promise<CharacterInfo>} - Character information
   * @throws {NotFoundError} - If character not found
   */
  async fetchCharacterById(characterId: number): Promise<CharacterInfo> {
    const data = await this.executeQuery<CharacterInfoResponse>(
      CHARACTER_INFO_QS,
      { id: characterId },
      `fetchCharacterById(${characterId})`
    );

    if (!data?.Character) {
      throw new NotFoundError(`Character with ID ${characterId} not found`);
    }

    return data.Character;
  }

  /**
   * Fetch detailed staff information by ID
   *
   * @param {number} staffId - Staff ID
   * @returns {Promise<StaffInfo>} - Staff information
   * @throws {NotFoundError} - If staff not found
   */
  async fetchStaffById(staffId: number): Promise<StaffInfo> {
    const data = await this.executeQuery<StaffInfoResponse>(
      STAFF_INFO_QS,
      { id: staffId },
      `fetchStaffById(${staffId})`
    );

    if (!data?.Staff) {
      throw new NotFoundError(`Staff with ID ${staffId} not found`);
    }

    return data.Staff;
  }
}

export default AnilistAnimeClient;
