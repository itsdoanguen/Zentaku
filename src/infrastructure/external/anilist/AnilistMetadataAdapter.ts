import type {
  BaseMetadataSource,
  CharacterInfo,
  MediaBasicInfo,
  MediaInfo,
  MediaSeason,
  MediaType,
  PageInfo,
  PaginatedMedia,
  SearchCriteria,
  SearchOptions,
  StaffInfo,
  TrendingOptions,
} from '../../../core/interfaces/IMetadataSource';
import type { CharacterEdge, MediaStatistics, StaffEdge } from './anilist.types';
import type { AnimeSearchCriteria } from './anime/anilist-anime.types';
import AnilistAnimeClient from './anime/AnilistAnimeClient';
import AnilistCharacterClient from './character/AnilistCharacterClient';
import type { MangaSearchCriteria } from './manga/anilist-manga.types';
import AnilistMangaClient from './manga/AnilistMangaClient';
import AnilistStaffClient from './staff/AnilistStaffClient';

/**
 * AniList Metadata Adapter
 * Implements BaseMetadataSource interface using AnilistAnimeClient
 *
 * @extends {BaseMetadataSource}
 */
class AnilistMetadataAdapter implements BaseMetadataSource {
  readonly sourceName = 'AniList';
  private readonly animeClient: AnilistAnimeClient;
  private readonly mangaClient: AnilistMangaClient;
  private readonly characterClient: AnilistCharacterClient;
  private readonly staffClient: AnilistStaffClient;

  constructor() {
    this.animeClient = new AnilistAnimeClient();
    this.mangaClient = new AnilistMangaClient();
    this.characterClient = new AnilistCharacterClient();
    this.staffClient = new AnilistStaffClient();
  }

  // ==================== PRIVATE METHODS ===================

  private mapSearchMediaToAnimeType(criteria: SearchCriteria): AnimeSearchCriteria {
    const anilistCriteria: AnimeSearchCriteria = {};
    if (criteria.genres) {
      anilistCriteria.genres = criteria.genres;
    }
    if (criteria.season) {
      anilistCriteria.season = criteria.season;
    }
    if (criteria.seasonYear) {
      anilistCriteria.seasonYear = criteria.seasonYear;
    }

    if (criteria.format) {
      anilistCriteria.format = Array.isArray(criteria.format)
        ? criteria.format.join(',')
        : criteria.format;
    }

    if (criteria.status) {
      anilistCriteria.status = Array.isArray(criteria.status)
        ? criteria.status.join(',')
        : criteria.status;
    }

    return anilistCriteria;
  }

  private mapSearchMediaToMangaType(criteria: SearchCriteria): MangaSearchCriteria {
    const mangaCriteria: MangaSearchCriteria = {};
    if (criteria.genres) {
      mangaCriteria.genres = criteria.genres;
    }

    if (criteria.format) {
      mangaCriteria.format = Array.isArray(criteria.format)
        ? criteria.format.join(',')
        : criteria.format;
    }

    if (criteria.status) {
      mangaCriteria.status = Array.isArray(criteria.status)
        ? criteria.status.join(',')
        : criteria.status;
    }

    if (criteria.countryOfOrigin) {
      mangaCriteria.countryOfOrigin = criteria.countryOfOrigin;
    }

    return mangaCriteria;
  }

  private mapSearchOptionsToAnilistType(options: SearchOptions): {
    page?: number;
    perPage?: number;
    sort?: string[];
  } {
    const anilistOptions: { page?: number; perPage?: number; sort?: string[] } = {};
    if (options.page) {
      anilistOptions.page = options.page;
    }
    if (options.perPage) {
      anilistOptions.perPage = options.perPage;
    }
    if (options.sort) {
      anilistOptions.sort = Array.isArray(options.sort) ? options.sort : [options.sort];
    }
    return anilistOptions;
  }
  // ==================== IMETADATASOURCE IMPLEMENTATION ====================

  /**
   * Get detailed media information
   *
   * @param mediaId - Media ID
   * @param mediaType - Media type
   * @returns Media information
   * @throws {Error} If unsupported media type
   */
  async getMediaInfo(mediaId: number, mediaType: MediaType = 'ANIME'): Promise<MediaInfo> {
    if (mediaType === 'ANIME') {
      return this.animeClient.fetchById(mediaId) as unknown as MediaInfo;
    }
    if (mediaType === 'MANGA') {
      return this.mangaClient.fetchById(mediaId) as unknown as MediaInfo;
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  /**
   * Get lightweight media information (for lists/cards)
   *
   * @param mediaId - Media ID
   * @param mediaType - Media type
   * @returns Basic media information
   * @throws {Error} If unsupported media type
   */
  async getMediaBasicInfo(
    mediaId: number,
    mediaType: MediaType = 'ANIME'
  ): Promise<MediaBasicInfo> {
    if (mediaType === 'ANIME') {
      return this.animeClient.fetchLightweight(mediaId) as unknown as MediaBasicInfo;
    }
    if (mediaType === 'MANGA') {
      return this.mangaClient.fetchLightweight(mediaId) as unknown as MediaBasicInfo;
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  /**
   * Get multiple media items in batch
   *
   * @param mediaIds - Array of media IDs
   * @param mediaType - Media type
   * @returns Map of mediaId => media data
   * @throws {Error} If unsupported media type
   */
  async getMediaBatch(
    mediaIds: number[],
    mediaType: MediaType = 'ANIME'
  ): Promise<Record<number, MediaInfo>> {
    if (mediaType === 'ANIME') {
      return this.animeClient.fetchBatch(mediaIds) as unknown as Record<number, MediaInfo>;
    }
    if (mediaType === 'MANGA') {
      return this.mangaClient.fetchBatch(mediaIds) as unknown as Record<number, MediaInfo>;
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  /**
   * Search media by keyword
   *
   * @param query - Search query
   * @param options - Search options
   * @returns Search results with pageInfo and media
   * @throws {Error} If unsupported media type
   */
  async searchMedia(query: string, options: SearchOptions = {}): Promise<PaginatedMedia> {
    const { mediaType = 'ANIME', ...searchOptions } = options;

    if (mediaType === 'ANIME') {
      return this.animeClient.search(query, searchOptions) as unknown as PaginatedMedia;
    }
    if (mediaType === 'MANGA') {
      return this.mangaClient.search(query, searchOptions) as unknown as PaginatedMedia;
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  /**
   * Advanced search by multiple criteria
   *
   * @param criteria - Search criteria
   * @param options - Pagination and sorting options
   * @returns Search results with pageInfo and media
   * @throws {Error} If unsupported media type
   */
  async searchByCriteria(
    criteria: SearchCriteria = {},
    options: SearchOptions = {}
  ): Promise<PaginatedMedia> {
    const { mediaType = 'ANIME', ...otherCriteria } = criteria as SearchCriteria & {
      mediaType?: MediaType;
    };

    if (mediaType === 'ANIME') {
      return this.animeClient.searchByCriteria(
        this.mapSearchMediaToAnimeType(otherCriteria),
        this.mapSearchOptionsToAnilistType(options)
      ) as unknown as PaginatedMedia;
    }
    if (mediaType === 'MANGA') {
      return this.mangaClient.searchByCriteria(
        this.mapSearchMediaToMangaType(otherCriteria),
        this.mapSearchOptionsToAnilistType(options)
      ) as unknown as PaginatedMedia;
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  /**
   * Get seasonal anime list
   *
   * @param season - Season (WINTER, SPRING, SUMMER, FALL)
   * @param year - Year
   * @param options - Pagination and sorting options
   * @returns Seasonal anime with pageInfo
   */
  async getSeasonalAnime(
    season: MediaSeason,
    year: number,
    options: SearchOptions = {}
  ): Promise<PaginatedMedia> {
    return this.animeClient.fetchSeasonal(
      season,
      year,
      this.mapSearchOptionsToAnilistType(options)
    ) as unknown as PaginatedMedia;
  }

  /**
   * Get trending media
   *
   * @param options - Pagination options
   * @returns Trending media list
   */
  async getTrending(
    options: TrendingOptions & { mediaType?: MediaType } = {}
  ): Promise<PaginatedMedia> {
    const { mediaType = 'ANIME', ...otherOptions } = options;
    return this.searchByCriteria(
      {},
      { ...otherOptions, mediaType, sort: ['TRENDING_DESC', 'POPULARITY_DESC'] }
    );
  }

  /**
   * Get popular media
   *
   * @param options - Pagination options
   * @returns Popular media list
   */
  async getPopular(
    options: TrendingOptions & { mediaType?: MediaType } = {}
  ): Promise<PaginatedMedia> {
    const { mediaType = 'ANIME', ...otherOptions } = options;
    return this.searchByCriteria({}, { ...otherOptions, mediaType, sort: ['POPULARITY_DESC'] });
  }

  /**
   * Get characters for a media
   *
   * @param mediaId - Media ID
   * @param mediaType - Media type (defaults to ANIME)
   * @param options - Pagination options
   * @returns Characters with pageInfo and edges
   */
  async getCharacters(
    mediaId: number,
    mediaType: MediaType = 'ANIME',
    options: { page?: number; perPage?: number } = {}
  ): Promise<{ pageInfo: PageInfo; edges: CharacterEdge[] }> {
    if (mediaType !== 'ANIME' && mediaType !== 'MANGA') {
      throw new Error(
        `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
      );
    }
    return this.characterClient.fetchByMediaId(mediaId, mediaType, options);
  }

  /**
   * Get staff for a media
   *
   * @param mediaId - Media ID
   * @param mediaType - Media type (defaults to ANIME)
   * @param options - Pagination options
   * @returns Staff with pageInfo and edges
   */
  async getStaff(
    mediaId: number,
    mediaType: MediaType = 'ANIME',
    options: { page?: number; perPage?: number } = {}
  ): Promise<{ pageInfo: PageInfo; edges: StaffEdge[] }> {
    if (mediaType !== 'ANIME' && mediaType !== 'MANGA') {
      throw new Error(
        `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
      );
    }
    return this.staffClient.fetchByMediaId(mediaId, mediaType, options);
  }

  /**
   * Get statistics for a media
   *
   * @param mediaId - Media ID
   * @param mediaType - Media type (defaults to ANIME)
   * @returns Media statistics
   * @throws {Error} If unsupported media type
   */
  async getStatistics(mediaId: number, mediaType: MediaType = 'ANIME'): Promise<MediaStatistics> {
    if (mediaType === 'ANIME') {
      return this.animeClient.fetchStatistics(mediaId);
    }
    if (mediaType === 'MANGA') {
      return this.mangaClient.fetchStatistics(mediaId);
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  /**
   * Get detailed character information
   *
   * @param characterId - Character ID
   * @returns Character information
   */
  async getCharacterInfoById(characterId: number): Promise<CharacterInfo> {
    return this.characterClient.fetchById(characterId) as unknown as CharacterInfo;
  }

  /**
   * Get detailed staff information
   *
   * @param staffId - Staff ID
   * @returns Staff information
   */
  async getStaffInfoById(staffId: number): Promise<StaffInfo> {
    return this.staffClient.fetchById(staffId) as unknown as StaffInfo;
  }

  /**
   * Get cover images in batch
   *
   * @param mediaIds - Array of media ID
   * @param mediaType - Media type (defaults to ANIME)
   * @returns Map of mediaId => cover URL
   * @throws {Error} If unsupported media type
   */
  async getCoversBatch(
    mediaIds: number[],
    mediaType: MediaType = 'ANIME'
  ): Promise<Record<number, string | null>> {
    if (mediaType === 'ANIME') {
      return this.animeClient.fetchCoversBatch(mediaIds);
    }
    if (mediaType === 'MANGA') {
      return this.mangaClient.fetchCoversBatch(mediaIds);
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  getSourceName(): string {
    return this.sourceName;
  }

  supportsMediaType(mediaType: MediaType): boolean {
    return mediaType === 'ANIME' || mediaType === 'MANGA';
  }

  getRateLimitInfo(): { limit: number; window: number } | null {
    return {
      limit: 60,
      window: 60000,
    };
  }
}

export default AnilistMetadataAdapter;
