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
import type { ReadingMediaSearchCriteria } from './reading-media/anilist-reading-media.types';
import AnilistReadingMediaClient from './reading-media/AnilistReadingMediaClient';
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
  private readonly readingMediaClient: AnilistReadingMediaClient;
  private readonly characterClient: AnilistCharacterClient;
  private readonly staffClient: AnilistStaffClient;

  constructor() {
    this.animeClient = new AnilistAnimeClient();
    this.readingMediaClient = new AnilistReadingMediaClient();
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

  private mapSearchMediaToMangaType(criteria: SearchCriteria): ReadingMediaSearchCriteria {
    const mangaCriteria: ReadingMediaSearchCriteria = {};
    if (criteria.genres) {
      mangaCriteria.genres = criteria.genres;
    }

    if (criteria.format) {
      const formats = Array.isArray(criteria.format) ? criteria.format : [criteria.format];
      mangaCriteria.formats = formats as any;
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

  // Get detailed media information. Throws error if unsupported media type.
  async getMediaInfo(mediaId: number, mediaType: MediaType = 'ANIME'): Promise<MediaInfo> {
    if (mediaType === 'ANIME') {
      return this.animeClient.fetchById(mediaId) as unknown as MediaInfo;
    }
    if (mediaType === 'MANGA') {
      return this.readingMediaClient.fetchById(mediaId) as unknown as MediaInfo;
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  // Get lightweight media information (for lists/cards). Throws error if unsupported media type.
  async getMediaBasicInfo(
    mediaId: number,
    mediaType: MediaType = 'ANIME'
  ): Promise<MediaBasicInfo> {
    if (mediaType === 'ANIME') {
      return this.animeClient.fetchLightweight(mediaId) as unknown as MediaBasicInfo;
    }
    if (mediaType === 'MANGA') {
      return this.readingMediaClient.fetchLightweight(mediaId) as unknown as MediaBasicInfo;
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  /**
   * Get multiple media items in batch
   * @param mediaIds Array of media IDs
   * @param mediaType Media type
   * @returns Map of mediaId => media data
   */
  async getMediaBatch(
    mediaIds: number[],
    mediaType: MediaType = 'ANIME'
  ): Promise<Record<number, MediaInfo>> {
    if (mediaType === 'ANIME') {
      return this.animeClient.fetchBatch(mediaIds) as unknown as Record<number, MediaInfo>;
    }
    if (mediaType === 'MANGA') {
      return this.readingMediaClient.fetchBatch(mediaIds) as unknown as Record<number, MediaInfo>;
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  /**
   * Search media by keyword
   * @param query Search query
   * @param options Search options
   * @returns Search results with pageInfo and media
   */
  async searchMedia(query: string, options: SearchOptions = {}): Promise<PaginatedMedia> {
    const { mediaType = 'ANIME', ...searchOptions } = options;

    if (mediaType === 'ANIME') {
      return this.animeClient.search(query, searchOptions) as unknown as PaginatedMedia;
    }
    if (mediaType === 'MANGA') {
      return this.readingMediaClient.search(query, searchOptions) as unknown as PaginatedMedia;
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  /**
   * Advanced search by multiple criteria
   * @param criteria Search criteria
   * @param options Pagination and sorting options
   * @returns Search results with pageInfo and media
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
      return this.readingMediaClient.searchByCriteria(
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

  async getTrending(
    options: TrendingOptions & { mediaType?: MediaType } = {}
  ): Promise<PaginatedMedia> {
    const { mediaType = 'ANIME', ...otherOptions } = options;
    return this.searchByCriteria(
      {},
      { ...otherOptions, mediaType, sort: ['TRENDING_DESC', 'POPULARITY_DESC'] }
    );
  }

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

  async getStatistics(mediaId: number, mediaType: MediaType = 'ANIME'): Promise<MediaStatistics> {
    if (mediaType === 'ANIME') {
      return this.animeClient.fetchStatistics(mediaId);
    }
    if (mediaType === 'MANGA') {
      return this.readingMediaClient.fetchStatistics(mediaId);
    }
    throw new Error(
      `AniList adapter currently only supports ANIME and MANGA media types, got: ${mediaType}`
    );
  }

  async getCharacterInfoById(characterId: number): Promise<CharacterInfo> {
    return this.characterClient.fetchById(characterId) as unknown as CharacterInfo;
  }

  async getStaffInfoById(staffId: number): Promise<StaffInfo> {
    return this.staffClient.fetchById(staffId) as unknown as StaffInfo;
  }

  async getCoversBatch(
    mediaIds: number[],
    mediaType: MediaType = 'ANIME'
  ): Promise<Record<number, string | null>> {
    if (mediaType === 'ANIME') {
      return this.animeClient.fetchCoversBatch(mediaIds);
    }
    if (mediaType === 'MANGA') {
      return this.readingMediaClient.fetchCoversBatch(mediaIds);
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
