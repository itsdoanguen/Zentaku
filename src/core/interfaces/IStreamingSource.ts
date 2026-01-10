/**
 * Streaming Source Interface
 *
 * Defines the contract for anime streaming/episode sources.
 * Implementations provide streaming links from external sources like Consumet.
 *
 * Responsibilities:
 * - Get available episodes list
 * - Get streaming links (m3u8, mp4) for each episode
 * - Get video quality information (360p, 720p, 1080p)
 * - Get subtitles/captions if available
 * - Search anime in source for ID mapping
 */

/**
 * Video quality
 */
export type VideoQuality = '360p' | '480p' | '720p' | '1080p' | '4k' | 'default' | 'backup';

/**
 * Subtitle language
 */
export interface Subtitle {
  url: string;
  lang: string;
  label?: string;
}

/**
 * Streaming link
 */
export interface StreamingLink {
  url: string;
  quality: VideoQuality;
  isM3U8: boolean;
  isDash?: boolean;
  size?: number;
  [key: string]: any;
}

/**
 * Streaming server
 */
export interface StreamingServer {
  name: string;
  url: string;
}

/**
 * Episode information
 */
export interface EpisodeInfo {
  id: string;
  animeId?: string;
  number: number;
  title?: string;
  description?: string;
  image?: string;
  airDate?: string | Date;
  isFiller?: boolean;
}

/**
 * Anime basic information from streaming source
 */
export interface AnimeStreamingInfo {
  id: string;
  title: string;
  url?: string;
  image?: string;
  releaseDate?: string;
  description?: string;
  genres?: string[];
  subOrDub?: 'sub' | 'dub' | 'both';
  type?: string;
  status?: string;
  otherName?: string;
  totalEpisodes?: number;
  episodes?: EpisodeInfo[];
}

/**
 * Search result from streaming source
 */
export interface AnimeSearchResult {
  id: string;
  title: string;
  url?: string;
  image?: string;
  releaseDate?: string;
  subOrDub?: 'sub' | 'dub' | 'both';
}

/**
 * Streaming links response
 */
export interface StreamingLinksResponse {
  headers?: Record<string, string>;
  sources: StreamingLink[];
  subtitles?: Subtitle[];
  download?: string;
  referer?: string;
  intro?: {
    start: number;
    end: number;
  };
  outro?: {
    start: number;
    end: number;
  };
}

/**
 * Search options
 */
export interface StreamingSearchOptions {
  page?: number;
  perPage?: number;
}

/**
 * Streaming link options
 */
export interface StreamingLinkOptions {
  server?: string;
  category?: 'sub' | 'dub' | 'raw';
}

/**
 * Streaming Source Interface
 * All streaming source implementations must follow this contract
 */
export interface IStreamingSource {
  /**
   * Source name (e.g., 'GogoAnime', 'Zoro', 'Crunchyroll')
   */
  readonly sourceName: string;

  /**
   * Search anime in streaming source to get ID mapping
   * (Since AniList ID differs from source ID, need to search for mapping)
   *
   * @param query - Anime title to search
   * @param options - Search options
   * @returns Search results
   *
   * @example
   * const results = await source.searchAnime('Naruto');
   */
  searchAnime(query: string, options?: StreamingSearchOptions): Promise<AnimeSearchResult[]>;

  /**
   * Get basic anime information from streaming source
   *
   * @param animeId - Anime ID in this source
   * @returns Anime information with episodes
   */
  getAnimeInfo(animeId: string): Promise<AnimeStreamingInfo>;

  /**
   * Get list of all available episodes
   *
   * @param animeId - Anime ID in source
   * @returns Episodes list
   *
   * @example
   * const episodes = await source.getEpisodes('naruto-123');
   */
  getEpisodes(animeId: string): Promise<EpisodeInfo[]>;

  /**
   * Get detailed information for a specific episode
   *
   * @param episodeId - Episode ID
   * @returns Episode information
   */
  getEpisodeInfo(episodeId: string): Promise<EpisodeInfo>;

  /**
   * Get streaming links for an episode (m3u8, mp4, etc.)
   * THIS IS THE CORE FEATURE of IStreamingSource!
   *
   * @param episodeId - Episode ID
   * @param options - Options (server, category)
   * @returns Streaming links and metadata
   *
   * @example
   * const links = await source.getStreamingLinks('naruto-ep-1');
   * // {
   * //   sources: [
   * //     { url: 'https://...m3u8', quality: '1080p', isM3U8: true },
   * //     { url: 'https://...mp4', quality: '720p', isM3U8: false }
   * //   ],
   * //   subtitles: [
   * //     { url: 'https://...vtt', lang: 'en' }
   * //   ]
   * // }
   */
  getStreamingLinks(
    episodeId: string,
    options?: StreamingLinkOptions
  ): Promise<StreamingLinksResponse>;

  /**
   * Get available streaming servers
   *
   * @param episodeId - Episode ID
   * @returns Available servers
   */
  getServers?(episodeId: string): Promise<StreamingServer[]>;

  /**
   * Map AniList anime ID to source anime ID
   * This is a helper for ID conversion
   *
   * @param anilistId - AniList anime ID
   * @returns Source anime ID or null if not found
   */
  mapFromAnilistId?(anilistId: number): Promise<string | null>;

  /**
   * Get recent episodes
   *
   * @param page - Page number
   * @returns Recent episodes
   */
  getRecentEpisodes?(page?: number): Promise<EpisodeInfo[]>;
}

/**
 * Abstract base class for streaming sources
 * Provides common functionality
 */
export abstract class BaseStreamingSource implements IStreamingSource {
  abstract readonly sourceName: string;

  abstract searchAnime(
    query: string,
    options?: StreamingSearchOptions
  ): Promise<AnimeSearchResult[]>;

  abstract getAnimeInfo(animeId: string): Promise<AnimeStreamingInfo>;

  abstract getEpisodes(animeId: string): Promise<EpisodeInfo[]>;

  abstract getEpisodeInfo(episodeId: string): Promise<EpisodeInfo>;

  abstract getStreamingLinks(
    episodeId: string,
    options?: StreamingLinkOptions
  ): Promise<StreamingLinksResponse>;

  /**
   * Helper to validate episode ID format
   */
  protected validateEpisodeId(episodeId: string): void {
    if (!episodeId || typeof episodeId !== 'string') {
      throw new Error('Invalid episode ID');
    }
  }

  /**
   * Helper to validate anime ID format
   */
  protected validateAnimeId(animeId: string): void {
    if (!animeId || typeof animeId !== 'string') {
      throw new Error('Invalid anime ID');
    }
  }
}
