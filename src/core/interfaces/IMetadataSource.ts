/**
 * Metadata Source Interface
 *
 * Defines the contract for anime/manga metadata information sources.
 * Implementations provide detailed media information from external APIs like AniList.
 *
 * Responsibilities:
 * - Detailed anime/manga information (title, description, cover, banner, rating)
 * - Search and filter by multiple criteria
 * - Character and staff information
 * - Statistics and rankings
 * - Seasonal anime listings
 */

/**
 * Media types
 */
export type MediaType = 'ANIME' | 'MANGA';
export type MediaFormat =
  | 'TV'
  | 'TV_SHORT'
  | 'MOVIE'
  | 'SPECIAL'
  | 'OVA'
  | 'ONA'
  | 'MUSIC'
  | 'MANGA'
  | 'NOVEL'
  | 'ONE_SHOT';
export type MediaStatus = 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
export type MediaSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

/**
 * Media title in multiple languages
 */
export interface MediaTitle {
  romaji?: string;
  english?: string;
  native?: string;
  userPreferred?: string;
}

/**
 * Media cover image
 */
export interface MediaCoverImage {
  extraLarge?: string;
  large?: string;
  medium?: string;
  color?: string;
}

/**
 * Date with year, month, day
 */
export interface FuzzyDate {
  year?: number;
  month?: number;
  day?: number;
}

/**
 * Character information
 */
export interface CharacterInfo {
  id: number;
  name: {
    full?: string;
    native?: string;
    alternative?: string[];
  };
  image?: {
    large?: string;
    medium?: string;
  };
  role?: 'MAIN' | 'SUPPORTING' | 'BACKGROUND';
  voiceActors?: Array<{
    id: number;
    name: string;
    language?: string;
    image?: string;
  }>;
}

/**
 * Staff information
 */
export interface StaffInfo {
  id: number;
  name: {
    full?: string;
    native?: string;
  };
  image?: {
    large?: string;
    medium?: string;
  };
  role?: string;
}

/**
 * Studio information
 */
export interface StudioInfo {
  id: number;
  name: string;
  isAnimationStudio?: boolean;
}

/**
 * Basic media information (for lists/cards)
 */
export interface MediaBasicInfo {
  id: number;
  title: MediaTitle;
  coverImage?: MediaCoverImage;
  format?: MediaFormat;
  status?: MediaStatus;
  averageScore?: number;
  popularity?: number;
  episodes?: number;
  chapters?: number;
}

/**
 * Complete media information
 */
export interface MediaInfo extends MediaBasicInfo {
  idMal?: number;
  description?: string;
  bannerImage?: string;
  genres?: string[];
  tags?: Array<{
    id: number;
    name: string;
    rank?: number;
    isMediaSpoiler?: boolean;
  }>;
  startDate?: FuzzyDate;
  endDate?: FuzzyDate;
  season?: MediaSeason;
  seasonYear?: number;
  duration?: number; // Episode duration in minutes
  volumes?: number;
  source?: string;
  countryOfOrigin?: string;
  isAdult?: boolean;
  meanScore?: number;
  favourites?: number;
  studios?: StudioInfo[];
  characters?: CharacterInfo[];
  staff?: StaffInfo[];
  relations?: Array<{
    id: number;
    relationType: string;
    title: MediaTitle;
  }>;
  recommendations?: Array<{
    id: number;
    rating: number;
    media: MediaBasicInfo;
  }>;
  externalLinks?: Array<{
    site: string;
    url: string;
  }>;
  streamingEpisodes?: Array<{
    title?: string;
    thumbnail?: string;
    url?: string;
    site?: string;
  }>;
}

/**
 * Pagination information
 */
export interface PageInfo {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

/**
 * Paginated result
 */
export interface PaginatedMedia<T = MediaInfo> {
  pageInfo: PageInfo;
  media: T[];
}

/**
 * Search criteria
 */
export interface SearchCriteria {
  genres?: string[];
  tags?: string[];
  season?: MediaSeason;
  seasonYear?: number;
  year?: number;
  format?: MediaFormat | MediaFormat[];
  status?: MediaStatus | MediaStatus[];
  source?: string;
  countryOfOrigin?: string;
  isAdult?: boolean;
  minimumScore?: number;
  episodesGreaterThan?: number;
  episodesLessThan?: number;
}

/**
 * Search options
 */
export interface SearchOptions {
  page?: number;
  perPage?: number;
  sort?: string | string[];
  mediaType?: MediaType;
}

/**
 * Trending options
 */
export interface TrendingOptions {
  page?: number;
  perPage?: number;
  mediaType?: MediaType;
}

/**
 * Metadata Source Interface
 * All metadata source implementations must follow this contract
 */
export interface IMetadataSource {
  /**
   * Source name (e.g., 'AniList', 'MyAnimeList')
   */
  readonly sourceName: string;

  /**
   * Get detailed media information (anime/manga)
   *
   * @param mediaId - Media ID in the source
   * @param mediaType - Media type ('ANIME', 'MANGA')
   * @returns Complete media information
   * @throws NotFoundError if media not found
   */
  getMediaInfo(mediaId: number, mediaType?: MediaType): Promise<MediaInfo>;

  /**
   * Get basic media information (optimized for lists/cards)
   *
   * @param mediaId - Media ID
   * @param mediaType - Media type
   * @returns Basic information (id, title, cover)
   */
  getMediaBasicInfo(mediaId: number, mediaType?: MediaType): Promise<MediaBasicInfo>;

  /**
   * Get multiple media items at once (batch)
   *
   * @param mediaIds - Array of media IDs
   * @param mediaType - Media type
   * @returns Map of mediaId to media data
   */
  getMediaBatch(mediaIds: number[], mediaType?: MediaType): Promise<Record<number, MediaInfo>>;

  /**
   * Search media by keyword
   *
   * @param query - Search query string
   * @param options - Search options (page, perPage, mediaType)
   * @returns Paginated search results
   */
  searchMedia(query: string, options?: SearchOptions): Promise<PaginatedMedia>;

  /**
   * Advanced search by multiple criteria
   *
   * @param criteria - Search criteria (genres, season, year, format, status)
   * @param options - Pagination and sort options
   * @returns Paginated search results
   */
  searchByCriteria(criteria: SearchCriteria, options?: SearchOptions): Promise<PaginatedMedia>;

  /**
   * Get seasonal anime list
   *
   * @param season - WINTER, SPRING, SUMMER, FALL
   * @param year - Year
   * @param options - Pagination & sort options
   * @returns Seasonal anime list
   */
  getSeasonalAnime(
    season: MediaSeason,
    year: number,
    options?: SearchOptions
  ): Promise<PaginatedMedia>;

  /**
   * Get trending media
   *
   * @param options - Pagination options
   * @returns Trending media list
   */
  getTrending(options?: TrendingOptions): Promise<PaginatedMedia>;

  /**
   * Get popular media
   *
   * @param options - Pagination options
   * @returns Popular media list
   */
  getPopular(options?: TrendingOptions): Promise<PaginatedMedia>;

  /**
   * Get upcoming media
   *
   * @param options - Pagination options
   * @returns Upcoming media list
   */
  getUpcoming?(options?: SearchOptions): Promise<PaginatedMedia>;

  /**
   * Get character information
   *
   * @param characterId - Character ID
   * @returns Character information
   */
  getCharacter?(characterId: number): Promise<CharacterInfo>;

  /**
   * Get staff information
   *
   * @param staffId - Staff ID
   * @returns Staff information
   */
  getStaff?(staffId: number): Promise<StaffInfo>;
}

/**
 * Abstract base class for metadata sources
 */
export abstract class BaseMetadataSource implements IMetadataSource {
  abstract readonly sourceName: string;

  abstract getMediaInfo(mediaId: number, mediaType?: MediaType): Promise<MediaInfo>;

  abstract getMediaBasicInfo(mediaId: number, mediaType?: MediaType): Promise<MediaBasicInfo>;

  abstract getMediaBatch(
    mediaIds: number[],
    mediaType?: MediaType
  ): Promise<Record<number, MediaInfo>>;

  abstract searchMedia(query: string, options?: SearchOptions): Promise<PaginatedMedia>;

  abstract searchByCriteria(
    criteria: SearchCriteria,
    options?: SearchOptions
  ): Promise<PaginatedMedia>;

  abstract getSeasonalAnime(
    season: MediaSeason,
    year: number,
    options?: SearchOptions
  ): Promise<PaginatedMedia>;

  abstract getTrending(options?: TrendingOptions): Promise<PaginatedMedia>;

  abstract getPopular(options?: TrendingOptions): Promise<PaginatedMedia>;
}
