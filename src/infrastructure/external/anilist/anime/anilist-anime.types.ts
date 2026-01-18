/**
 * AniList API Anime Type Definitions
 * TypeScript interfaces for anime-specific GraphQL query responses
 */

import type {
  AnimeTitle,
  CoverImage,
  MediaDate,
  NextAiringEpisode,
  PageInfo,
  Studio,
  Tag,
  Trailer,
} from '../anilist.types';

// ========== Anime Types ==========

export interface AnimeInfo {
  id: number;
  idMal?: number;
  siteUrl?: string;
  title: AnimeTitle;
  synonyms?: string[];
  format?: string;
  episodes?: number;
  duration?: number;
  status?: string;
  startDate?: MediaDate;
  endDate?: MediaDate;
  season?: string;
  seasonYear?: number;
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
  studios?: {
    nodes: Studio[];
  };
  trailer?: Trailer;
  nextAiringEpisode?: NextAiringEpisode;
}

export interface AnimeLightweight {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  episodes?: number;
  nextAiringEpisode?: NextAiringEpisode;
}

export interface AnimeBatchInfo {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  episodes?: number;
}

export interface AnimeCover {
  id: number;
  coverImage: CoverImage;
}

export interface AnimeSearchResult {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  averageScore?: number;
  popularity?: number;
  episodes?: number;
  season?: string;
  isAdult?: boolean;
}

export interface AnimeSeasonalResult {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  bannerImage?: string;
  averageScore?: number;
  popularity?: number;
  episodes?: number;
  season?: string;
  isAdult?: boolean;
  nextAiringEpisode?: NextAiringEpisode;
  trending?: number;
}

// ========== Statistics Types ==========

export interface Ranking {
  id: number;
  rank: number;
  type: string;
  format?: string;
  year?: number;
  season?: string;
  allTime?: boolean;
  context: string;
}

export interface ScoreDistribution {
  score: number;
  amount: number;
}

export interface StatusDistribution {
  status: string;
  amount: number;
}

export interface AnimeStatistics {
  id: number;
  averageScore?: number;
  meanScore?: number;
  rankings?: Ranking[];
  stats?: {
    scoreDistribution?: ScoreDistribution[];
    statusDistribution?: StatusDistribution[];
  };
}

// ========== Streaming Types ==========

export interface StreamingEpisode {
  title?: string;
  url: string;
  site: string;
}

// ========== Response Wrappers ==========

export interface AnimeInfoResponse {
  Media: AnimeInfo;
}

export interface AnimeLightweightResponse {
  Media: AnimeLightweight;
}

export interface AnimeBatchResponse {
  Page: {
    media: AnimeBatchInfo[];
  };
}

export interface AnimeCoversBatchResponse {
  Page: {
    media: AnimeCover[];
  };
}

export interface AnimeSearchResponse {
  Page: {
    pageInfo: PageInfo;
    media: AnimeSearchResult[];
  };
}

export interface AnimeSeasonalResponse {
  Page: {
    pageInfo: PageInfo;
    media: AnimeSeasonalResult[];
  };
}

export interface AnimeStatisticsResponse {
  Media: AnimeStatistics;
}

export interface StreamingEpisodesResponse {
  Media: {
    streamingEpisodes: StreamingEpisode[];
  };
}

// ========== Search Criteria ==========

export interface AnimeSearchCriteria {
  genres?: string[];
  season?: string;
  seasonYear?: number;
  format?: string;
  status?: string;
}
