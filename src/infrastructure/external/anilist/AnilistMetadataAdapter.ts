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
import AnilistAnimeClient from './AnilistAnimeClient';
import type {
  AnimeSearchCriteria,
  AnimeStatistics,
  CharacterEdge,
  StaffEdge,
} from './anilist.types';

/**
 * AniList Metadata Adapter
 * Implements BaseMetadataSource interface using AnilistAnimeClient
 *
 * @extends {BaseMetadataSource}
 */
class AnilistMetadataAdapter implements BaseMetadataSource {
  readonly sourceName = 'AniList';
  private readonly animeClient: AnilistAnimeClient;

  constructor() {
    this.animeClient = new AnilistAnimeClient();
  }

  // ==================== PRIVATE METHODS ===================

  /**
   * Convert generic SearchMedia type to AniList specific type
   */
  private mapSearchMediaToAnilistType(criteria: SearchCriteria): AnimeSearchCriteria {
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

  /**
   * Convert search options to AniList specific format
   */
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
    if (mediaType !== 'ANIME') {
      throw new Error(
        `AniList adapter currently only supports ANIME media type, got: ${mediaType}`
      );
    }
    return this.animeClient.fetchById(mediaId) as unknown as MediaInfo;
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
    if (mediaType !== 'ANIME') {
      throw new Error(
        `AniList adapter currently only supports ANIME media type, got: ${mediaType}`
      );
    }
    return this.animeClient.fetchLightweight(mediaId) as unknown as MediaBasicInfo;
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
    if (mediaType !== 'ANIME') {
      throw new Error(
        `AniList adapter currently only supports ANIME media type, got: ${mediaType}`
      );
    }
    return this.animeClient.fetchBatch(mediaIds) as unknown as Record<number, MediaInfo>;
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

    if (mediaType !== 'ANIME') {
      throw new Error(
        `AniList adapter currently only supports ANIME media type, got: ${mediaType}`
      );
    }

    return this.animeClient.search(query, searchOptions) as unknown as PaginatedMedia;
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

    if (mediaType !== 'ANIME') {
      throw new Error(
        `AniList adapter currently only supports ANIME media type, got: ${mediaType}`
      );
    }

    return this.animeClient.searchByCriteria(
      this.mapSearchMediaToAnilistType(otherCriteria),
      this.mapSearchOptionsToAnilistType(options)
    ) as unknown as PaginatedMedia;
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
   * Get trending anime
   *
   * @param options - Pagination options
   * @returns Trending anime list
   */
  async getTrending(options: TrendingOptions = {}): Promise<PaginatedMedia> {
    return this.searchByCriteria({}, { ...options, sort: ['TRENDING_DESC', 'POPULARITY_DESC'] });
  }

  /**
   * Get popular anime
   *
   * @param options - Pagination options
   * @returns Popular anime list
   */
  async getPopular(options: TrendingOptions = {}): Promise<PaginatedMedia> {
    return this.searchByCriteria({}, { ...options, sort: ['POPULARITY_DESC'] });
  }

  /**
   * Get characters for a media
   *
   * @param mediaId - Media ID
   * @param options - Pagination options
   * @returns Characters with pageInfo and edges
   */
  async getCharacters(
    mediaId: number,
    options: { page?: number; perPage?: number } = {}
  ): Promise<{ pageInfo: PageInfo; edges: CharacterEdge[] }> {
    return this.animeClient.fetchCharacters(mediaId, this.mapSearchOptionsToAnilistType(options));
  }

  /**
   * Get staff for a media
   *
   * @param mediaId - Media ID
   * @param options - Pagination options
   * @returns Staff with pageInfo and edges
   */
  async getStaff(
    mediaId: number,
    options: { page?: number; perPage?: number } = {}
  ): Promise<{ pageInfo: PageInfo; edges: StaffEdge[] }> {
    return this.animeClient.fetchStaff(mediaId, options);
  }

  /**
   * Get statistics for a media
   *
   * @param mediaId - Media ID
   * @returns Media statistics
   */
  async getStatistics(mediaId: number): Promise<AnimeStatistics> {
    return this.animeClient.fetchStatistics(mediaId);
  }

  /**
   * Get detailed character information
   *
   * @param characterId - Character ID
   * @returns Character information
   */
  async getCharacter(characterId: number): Promise<CharacterInfo> {
    return this.animeClient.fetchCharacterById(characterId) as unknown as CharacterInfo;
  }

  /**
   * Get detailed staff information
   *
   * @param staffId - Staff ID
   * @returns Staff information
   */
  async getStaffById(staffId: number): Promise<StaffInfo> {
    return this.animeClient.fetchStaffById(staffId) as unknown as StaffInfo;
  }

  /**
   * Get cover images in batch
   *
   * @param mediaIds - Array of media ID
   * @returns Map of mediaId => cover URL
   */
  async getCoversBatch(mediaIds: number[]): Promise<Record<number, string | null>> {
    return this.animeClient.fetchCoversBatch(mediaIds);
  }

  /**
   * Get source name
   *
   * @returns 'AniList'
   */
  getSourceName(): string {
    return this.sourceName;
  }

  /**
   * Check if media type is supported
   *
   * @param mediaType - Media type to check
   * @returns True if supported
   */
  supportsMediaType(mediaType: MediaType): boolean {
    return mediaType === 'ANIME';
  }

  /**
   * Get rate limit information
   *
   * @returns Rate limit info
   */
  getRateLimitInfo(): { limit: number; window: number } | null {
    return {
      limit: 60,
      window: 60000,
    };
  }
}

export default AnilistMetadataAdapter;
