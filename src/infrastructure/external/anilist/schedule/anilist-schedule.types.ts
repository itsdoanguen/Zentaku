import type { PageInfo } from '../anilist.types';

export interface AiringScheduleMedia {
  id: number;
  title: {
    romaji: string;
    english?: string;
    native?: string;
  };
  coverImage: {
    large: string;
  };
  season?: string;
  seasonYear?: number;
}

export interface AiringScheduleEdge {
  id: number;
  airingAt: number; // Unix timestamp
  timeUntilAiring: number; // Seconds
  episode: number;
  media: AiringScheduleMedia;
}

export interface AiringScheduleResponse {
  Page: {
    pageInfo: PageInfo;
    airingSchedules: AiringScheduleEdge[];
  };
}
