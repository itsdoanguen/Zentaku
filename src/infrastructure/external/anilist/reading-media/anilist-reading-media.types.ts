/**
 * AniList API Reading Media Type Definitions
 *
 * Handles both Manga and Novel reading media types.
 * Format differentiation: MANGA, ONE_SHOT, MANHWA, MANHUA, NOVEL, LIGHT_NOVEL
 */

import type {
  AnimeTitle,
  CoverImage,
  MediaDate,
  MediaRanking,
  MediaScoreDistribution,
  MediaStatistics,
  MediaStatusDistribution,
  PageInfo,
  Tag,
} from '../anilist.types';

// ========== Media Format Types ==========

export type MediaFormat = 'MANGA' | 'ONE_SHOT' | 'MANHWA' | 'MANHUA' | 'NOVEL' | 'LIGHT_NOVEL';

export type FormatGroup = 'manga' | 'novel';

// ========== Reading Media Types ==========

export interface ReadingMediaInfo {
  id: number;
  idMal?: number;
  siteUrl?: string;
  title: AnimeTitle;
  synonyms?: string[];
  format?: string;
  chapters?: number;
  volumes?: number;
  status?: string;
  startDate?: MediaDate;
  endDate?: MediaDate;
  coverImage: CoverImage;
  bannerImage?: string;
  description?: string;
  isAdult?: boolean;
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  favourites?: number;
  genres?: string[];
  tags?: Tag[];
  source?: string;
  hashtag?: string;
  countryOfOrigin?: string;
  isLicensed?: boolean;
}

export interface ReadingMediaLightweight {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  chapters?: number;
  volumes?: number;
}

export interface ReadingMediaBatchInfo {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  chapters?: number;
  volumes?: number;
}

export interface ReadingMediaCover {
  id: number;
  coverImage: CoverImage;
}

export interface ReadingMediaSearchResult {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  averageScore?: number;
  popularity?: number;
  chapters?: number;
  volumes?: number;
  format?: string;
  isAdult?: boolean;
}

export interface ReadingMediaSearchByGenreResult {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  bannerImage?: string;
  averageScore?: number;
  popularity?: number;
  chapters?: number;
  volumes?: number;
  format?: string;
  genres?: string[];
  isAdult?: boolean;
  trending?: number;
  countryOfOrigin?: string;
}

// ========== Statistics Types ==========
export type ReadingMediaStatistics = MediaStatistics;
export type ReadingMediaRanking = MediaRanking;
export type ReadingMediaScoreDistribution = MediaScoreDistribution;
export type ReadingMediaStatusDistribution = MediaStatusDistribution;

// ========== Response Wrappers ==========

export interface ReadingMediaInfoResponse {
  Media: ReadingMediaInfo;
}

export interface ReadingMediaLightweightResponse {
  Media: ReadingMediaLightweight;
}

export interface ReadingMediaBatchResponse {
  Page: {
    media: ReadingMediaBatchInfo[];
  };
}

export interface ReadingMediaCoversBatchResponse {
  Page: {
    media: ReadingMediaCover[];
  };
}

export interface ReadingMediaSearchResponse {
  Page: {
    pageInfo: PageInfo;
    media: ReadingMediaSearchResult[];
  };
}

export interface ReadingMediaSearchByGenreResponse {
  Page: {
    pageInfo: PageInfo;
    media: ReadingMediaSearchByGenreResult[];
  };
}

export interface ReadingMediaStatisticsResponse {
  Media: MediaStatistics;
}

// ========== Search Criteria ==========

export interface ReadingMediaSearchCriteria {
  genres?: string[];
  formats?: MediaFormat[];
  status?: string;
  countryOfOrigin?: string;
}

// ========== Backward Compatibility Types (Aliases) ==========
// These maintain compatibility with existing code

export type MangaInfo = ReadingMediaInfo;
export type MangaLightweight = ReadingMediaLightweight;
export type MangaBatchInfo = ReadingMediaBatchInfo;
export type MangaCover = ReadingMediaCover;
export type MangaSearchResult = ReadingMediaSearchResult;
export type MangaSearchByGenreResult = ReadingMediaSearchByGenreResult;
export type MangaStatistics = ReadingMediaStatistics;
export type MangaRanking = ReadingMediaRanking;
export type MangaScoreDistribution = ReadingMediaScoreDistribution;
export type MangaStatusDistribution = ReadingMediaStatusDistribution;
export type MangaInfoResponse = ReadingMediaInfoResponse;
export type MangaLightweightResponse = ReadingMediaLightweightResponse;
export type MangaBatchResponse = ReadingMediaBatchResponse;
export type MangaCoversBatchResponse = ReadingMediaCoversBatchResponse;
export type MangaSearchResponse = ReadingMediaSearchResponse;
export type MangaSearchByGenreResponse = ReadingMediaSearchByGenreResponse;
export type MangaStatisticsResponse = ReadingMediaStatisticsResponse;
export type MangaSearchCriteria = ReadingMediaSearchCriteria;
