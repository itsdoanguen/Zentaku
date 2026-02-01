/**
 * AniList API Manga Type Definitions
 * TypeScript interfaces for manga-specific GraphQL query responses
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

// ========== Manga Types ==========

export interface MangaInfo {
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

export interface MangaLightweight {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  chapters?: number;
  volumes?: number;
}

export interface MangaBatchInfo {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  chapters?: number;
  volumes?: number;
}

export interface MangaCover {
  id: number;
  coverImage: CoverImage;
}

export interface MangaSearchResult {
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

export interface MangaSearchByGenreResult {
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
export type MangaStatistics = MediaStatistics;
export type MangaRanking = MediaRanking;
export type MangaScoreDistribution = MediaScoreDistribution;
export type MangaStatusDistribution = MediaStatusDistribution;

// ========== Response Wrappers ==========

export interface MangaInfoResponse {
  Media: MangaInfo;
}

export interface MangaLightweightResponse {
  Media: MangaLightweight;
}

export interface MangaBatchResponse {
  Page: {
    media: MangaBatchInfo[];
  };
}

export interface MangaCoversBatchResponse {
  Page: {
    media: MangaCover[];
  };
}

export interface MangaSearchResponse {
  Page: {
    pageInfo: PageInfo;
    media: MangaSearchResult[];
  };
}

export interface MangaSearchByGenreResponse {
  Page: {
    pageInfo: PageInfo;
    media: MangaSearchByGenreResult[];
  };
}

export interface MangaStatisticsResponse {
  Media: MediaStatistics;
}

// ========== Search Criteria ==========

export interface MangaSearchCriteria {
  genres?: string[];
  format?: string;
  status?: string;
  countryOfOrigin?: string;
}
