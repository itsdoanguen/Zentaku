/**
 * AniList API Shared Type Definitions
 * Common TypeScript interfaces used across all AniList modules
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
