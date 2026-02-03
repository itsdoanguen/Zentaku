/**
 * @module MalSyncTypes
 */

export interface MalSyncResponse {
  id: number;
  type: 'anime' | 'manga';

  title: string;
  url: string;
  total: number | null;
  image: string;
  malId: number;

  Sites?: {
    Zoro?: Record<string, ZoroSite>;
    [key: string]: Record<string, unknown> | undefined;
  };
}

export interface ZoroSite {
  id: number;
  identifier: string;
  image: string;
  malId: number;
  aniId: number;
  page: string;
  title: string;
  type: 'anime' | 'manga';
  url: string;
}

export interface MalSyncError {
  message: string;

  statusCode: number;
}

export enum MalSyncEndpoint {
  ANIME_BY_ANILIST = '/mal/anime/anilist:',

  ANIME_BY_MAL = '/mal/anime/',

  MANGA_BY_ANILIST = '/mal/manga/anilist:',

  MANGA_BY_MAL = '/mal/manga/',
}
