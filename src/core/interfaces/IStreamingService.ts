import type {
  AvailableEpisodesResponse,
  EpisodeSourcesResponse,
  SyncHianimeIdResponse,
} from '../types/streaming.types';

export interface IStreamingService {
  /**
   * Sync HiAnime ID for an anime
   *
   * @param anilistId - AniList anime ID
   * @returns Sync result with HiAnime ID
   */
  syncHianimeId(anilistId: number): Promise<SyncHianimeIdResponse>;

  /**
   * Get streaming sources for a specific episode
   */
  getEpisodeSources(
    anilistId: number,
    episodeNumber: number,
    server?: string,
    category?: 'sub' | 'dub' | 'raw'
  ): Promise<EpisodeSourcesResponse>;

  /**
   * Get available episodes for an anime
   */
  getAvailableEpisodes(anilistId: number): Promise<AvailableEpisodesResponse>;
}
