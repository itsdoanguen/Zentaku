/**
 * AniList API Reading Media Type Definitions
 *
 * Handles both Manga and Novel reading media types.
 */

import type {
  AnimeTitle,
  CharacterEdge,
  CoverImage,
  MediaDate,
  MediaRanking,
  MediaScoreDistribution,
  MediaStatistics,
  MediaStatusDistribution,
  PageInfo,
  StaffEdge,
  Tag,
} from '../anilist.types';

// ========== Media Format Types ==========

export type MediaFormat = 'MANGA' | 'ONE_SHOT' | 'NOVEL';

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
  format?: string;
}

export interface ReadingMediaBatchInfo {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  chapters?: number;
  volumes?: number;
  format?: string;
}

export interface ReadingMediaCover {
  id: number;
  coverImage: CoverImage;
  format?: string;
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

export interface ReadingMediaOverview {
  id: number;

  relations?: {
    edges: ReadingMediaRelationEdge[];
  };

  characters?: {
    edges: CharacterEdge[];
    pageInfo: PageInfo;
  };

  staff?: {
    edges: StaffEdge[];
    pageInfo: PageInfo;
  };

  stats?: {
    scoreDistribution?: MediaScoreDistribution[];
    statusDistribution?: MediaStatusDistribution[];
  };

  rankings?: MediaRanking[];

  recommendations?: {
    edges: {
      node: ReadingMediaRecommendationNode;
    }[];
    pageInfo: PageInfo;
  };
}

export interface ReadingMediaRelationEdge {
  id: number;
  relationType?: string;
  node: {
    id: number;
    type?: string;
    format?: string;
    title: AnimeTitle;
    coverImage: CoverImage;
    status?: string;
    episodes?: number;
    chapters?: number;
    volumes?: number;
    averageScore?: number;
  };
}

export interface ReadingMediaRecommendationNode {
  id: number;
  rating?: number;
  mediaRecommendation: {
    id: number;
    title: AnimeTitle;
    coverImage: CoverImage;
    format?: string;
    chapters?: number;
    volumes?: number;
    averageScore?: number;
    popularity?: number;
  };
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

export interface ReadingMediaOverviewResponse {
  Media: ReadingMediaOverview;
}

// ========== Search Criteria ==========

export interface ReadingMediaSearchCriteria {
  genres?: string[];
  formats?: MediaFormat[];
  status?: string;
  countryOfOrigin?: string;
}
