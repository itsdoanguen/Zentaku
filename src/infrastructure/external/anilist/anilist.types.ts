/**
 * AniList API Response Type Definitions
 * TypeScript interfaces for GraphQL query responses
 */

// ========== Common Types ==========

export interface PageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  perPage?: number;
}

export interface AnimeTitle {
  romaji: string;
  english?: string;
  native?: string;
}

export interface CoverImage {
  large: string;
}

export interface MediaDate {
  year?: number;
  month?: number;
  day?: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Studio {
  id: number;
  name: string;
}

export interface Trailer {
  id: string;
  site: string;
  thumbnail?: string;
}

export interface NextAiringEpisode {
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
}

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

// ========== Character & Staff Types ==========

export interface CharacterName {
  full: string;
  native?: string;
}

export interface CharacterImage {
  large: string;
}

export interface VoiceActor {
  id: number;
  name: CharacterName;
  image: CharacterImage;
  language: string;
}

export interface CharacterNode {
  id: number;
  name: CharacterName;
  image: CharacterImage;
}

export interface CharacterEdge {
  node: CharacterNode;
  role: string;
  voiceActors: VoiceActor[];
}

export interface StaffNode {
  id: number;
  name: CharacterName;
  image: CharacterImage;
}

export interface StaffEdge {
  node: StaffNode;
  role: string;
}

export interface MediaNode {
  id: number;
  title: {
    romaji: string;
    english?: string;
  };
  coverImage: CoverImage;
  type: string;
  format?: string;
  status?: string;
  episodes?: number;
  season?: string;
  seasonYear?: number;
}

export interface CharacterInfo {
  id: number;
  name: CharacterName;
  image: CharacterImage;
  description?: string;
  media?: {
    nodes: MediaNode[];
  };
}

export interface StaffInfo {
  id: number;
  name: CharacterName;
  image: CharacterImage;
  description?: string;
  languageV2?: string;
  gender?: string;
  dateOfBirth?: MediaDate;
  dateOfDeath?: MediaDate;
  age?: number;
  yearsActive?: number[];
  homeTown?: string;
  bloodType?: string;
  primaryOccupations?: string[];
  staffMedia?: {
    nodes: MediaNode[];
  };
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

export interface CharactersResponse {
  Media: {
    characters: {
      pageInfo: PageInfo;
      edges: CharacterEdge[];
    };
  };
}

export interface StaffResponse {
  Media: {
    staff: {
      pageInfo: PageInfo;
      edges: StaffEdge[];
    };
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

export interface CharacterInfoResponse {
  Character: CharacterInfo;
}

export interface StaffInfoResponse {
  Staff: StaffInfo;
}
