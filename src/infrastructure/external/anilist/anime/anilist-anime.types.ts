/**
 * AniList API Anime Type Definitions
 * TypeScript interfaces for anime-specific GraphQL query responses
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
  NextAiringEpisode,
  PageInfo,
  StaffEdge,
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
export type AnimeStatistics = MediaStatistics;
export type Ranking = MediaRanking;
export type ScoreDistribution = MediaScoreDistribution;
export type StatusDistribution = MediaStatusDistribution;

// ========== Overview Types ==========

export interface AnimeRelationEdge {
  id: number;
  relationType: string;
  node: {
    id: number;
    type: string;
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
export interface AnimeRecommendationNode {
  id: number;
  rating: number;
  userRating?: string;
  mediaRecommendation: {
    id: number;
    type: string;
    format?: string;
    title: AnimeTitle;
    coverImage: CoverImage;
    averageScore?: number;
    popularity?: number;
    favourites?: number;
    episodes?: number;
  };
}

export interface AnimeOverview {
  id: number;

  relations?: {
    edges: AnimeRelationEdge[];
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
      node: AnimeRecommendationNode;
    }[];
    pageInfo: PageInfo;
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
  Media: MediaStatistics;
}

export interface AnimeOverviewResponse {
  Media: AnimeOverview;
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
