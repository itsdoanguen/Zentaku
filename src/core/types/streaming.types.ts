import type { EpisodeSources } from '../../infrastructure/external/aniwatch/aniwatch.types';

export interface GetEpisodeSourcesParams {
  anilistId: number;
  episodeNumber: number;
  server?: StreamingServer;
  category?: AudioCategory;
}

export type StreamingServer = 'hd-1' | 'hd-2' | 'meg-1' | 'meg-2';

export type AudioCategory = 'sub' | 'dub' | 'raw';

export interface EpisodeSourcesResponse extends EpisodeSources {
  anilistId: number;
  episodeNumber: number;
  hianimeId: string;
}

export interface SyncHianimeIdResponse {
  anilistId: number;
  hianimeId: string;
  wasSynced: boolean;
  source: 'database' | 'malsync';
}

export interface AvailableEpisodesResponse {
  anilistId: number;
  hianimeId: string;
  totalEpisodes: number;
  episodes: EpisodeInfo[];
}

export interface EpisodeInfo {
  number: number;
  title: string;
  episodeId: string;
  isFiller?: boolean;
}

export enum StreamingErrorCode {
  ANIME_NOT_FOUND = 'ANIME_NOT_FOUND',
  HIANIME_ID_NOT_FOUND = 'HIANIME_ID_NOT_FOUND',
  MALSYNC_API_ERROR = 'MALSYNC_API_ERROR',
  ANIWATCH_API_ERROR = 'ANIWATCH_API_ERROR',
  EPISODE_NOT_AVAILABLE = 'EPISODE_NOT_AVAILABLE',
}
