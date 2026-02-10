/**
 * Aniwatch API Type Definitions
 *
 * @module AniwatchTypes
 */

export interface EpisodeSources {
  headers: {
    Referer: string;
    'User-Agent': string;
  };
  sources: VideoSource[];
  subtitles: Subtitle[];
  anilistID?: number | null;
  malID?: number | null;
  download?: string;
  intro?: {
    start: number;
    end: number;
  };
  outro?: {
    start: number;
    end: number;
  };
}

export interface VideoSource {
  url: string;
  quality?: string;
  isM3U8: boolean;
}

export interface Subtitle {
  url: string;
  lang: string;
}

export interface ServerInfo {
  serverId: number;
  serverName: string;
}

export interface EpisodeServers {
  episodeId: string;
  episodeNo: number;
  sub: ServerInfo[];
  dub: ServerInfo[];
  raw: ServerInfo[];
}

export interface AnimeEpisodes {
  totalEpisodes: number;
  episodes: Episode[];
}

export interface Episode {
  number: number;
  title: string;
  episodeId: string;
  isFiller?: boolean;
}

export interface AniwatchError {
  message: string;
  statusCode: number;
}

export interface AniwatchWrappedResponse<T> {
  success: boolean;
  data: T;
}

export const STREAMING_SERVERS = ['hd-1', 'hd-2', 'meg-1', 'meg-2'] as const;
export type StreamingServer = (typeof STREAMING_SERVERS)[number];

export const StreamingServerEnum = {
  HD_1: 'hd-1' as StreamingServer,
  HD_2: 'hd-2' as StreamingServer,
  MEG_1: 'meg-1' as StreamingServer,
  MEG_2: 'meg-2' as StreamingServer,
} as const;

export const AUDIO_CATEGORIES = ['sub', 'dub', 'raw'] as const;
export type AudioCategory = (typeof AUDIO_CATEGORIES)[number];
export const AudioCategoryEnum = {
  SUB: 'sub' as AudioCategory,
  DUB: 'dub' as AudioCategory,
  RAW: 'raw' as AudioCategory,
} as const;

export enum AniwatchEndpoint {
  EPISODE_SOURCES = '/anime/episode/sources',
  EPISODE_SERVERS = '/anime/episode/servers',
  ANIME_EPISODES = '/anime/episodes',
  SEARCH = '/anime/search',
}
