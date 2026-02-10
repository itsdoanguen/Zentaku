import type {
  AudioCategory,
  AvailableEpisodesResponse,
  EpisodeServersResponse,
  EpisodeSourcesResponse,
  StreamingServer,
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
    server?: StreamingServer,
    category?: AudioCategory
  ): Promise<EpisodeSourcesResponse>;

  /**
   * Get available episodes for an anime
   */
  getAvailableEpisodes(anilistId: number): Promise<AvailableEpisodesResponse>;

  /**
   * Get available servers for a specific episode
   */
  getEpisodeServers(anilistId: number, episodeNumber: number): Promise<EpisodeServersResponse>;
}
