/**
 * Aniwatch API Client
 *
 * @module AniwatchClient
 */

import type { AxiosError } from 'axios';
import logger from '../../../shared/utils/logger';
import httpClient from '../../http/httpClient';
import type {
  AnimeEpisodes,
  AniwatchError,
  AudioCategory,
  EpisodeServers,
  EpisodeSources,
  StreamingServer,
} from './aniwatch.types';
import {
  AUDIO_CATEGORIES,
  AudioCategoryEnum,
  STREAMING_SERVERS,
  StreamingServerEnum,
} from './aniwatch.types';

class AniwatchClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ANIWATCH_API_URL || 'http://localhost:4000';
    logger.info(`[Aniwatch] Client initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Get streaming sources for a specific episode
   *
   * @param episodeId - Format: "{animeId}?ep={episodeNumber}" (e.g., "100?ep=1")
   * @param server - Streaming server to use (default: "hd-1")
   * @param category - Audio category (default: "sub")
   * @returns Episode sources with video URLs and subtitles
   * @throws Error if API request fails or episode not found
   *
   * @example
   * const sources = await client.getEpisodeSources("100?ep=1", "hd-1", "sub");
   * // Returns: { sources: [...], subtitles: [...], intro: {...}, outro: {...} }
   */
  async getEpisodeSources(
    episodeId: string,
    server: StreamingServer = StreamingServerEnum.HD_1,
    category: AudioCategory = AudioCategoryEnum.SUB
  ): Promise<EpisodeSources> {
    try {
      logger.info(
        `[Aniwatch] Fetching sources for episode: ${episodeId} (server: ${server}, category: ${category})`
      );

      const response = await httpClient.get<EpisodeSources>(
        `${this.baseUrl}/anime/episode/sources`,
        {
          params: {
            episodeId,
            server,
            category,
          },
        }
      );

      logger.info(
        `[Aniwatch] Successfully fetched ${response.data.sources.length} sources for episode: ${episodeId}`
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<AniwatchError>;

      if (axiosError.response?.status === 404) {
        logger.warn(`[Aniwatch] Episode not found: ${episodeId}`);
        throw new Error(`Episode ${episodeId} not found on streaming server`);
      }

      if (axiosError.code === 'ECONNREFUSED') {
        logger.error(`[Aniwatch] Cannot connect to API server at ${this.baseUrl}`);
        throw new Error(
          `Aniwatch API server is not running. Please start the server at ${this.baseUrl}`
        );
      }

      logger.error(`[Aniwatch] Failed to fetch sources for episode ${episodeId}:`, error);
      throw new Error(`Failed to fetch episode sources: ${axiosError.message || 'Unknown error'}`);
    }
  }

  /**
   * Get available servers for an episode
   *
   * @param episodeId - Episode identifier (e.g., "100?ep=1")
   * @returns Available servers categorized by audio type
   * @throws Error if API request fails or episode not found
   *
   * @example
   * const servers = await client.getEpisodeServers("100?ep=1");
   * // Returns: { episodeId, episodeNo, sub: [...], dub: [...], raw: [...] }
   */
  async getEpisodeServers(episodeId: string): Promise<EpisodeServers> {
    try {
      logger.info(`[Aniwatch] Fetching servers for episode: ${episodeId}`);

      const response = await httpClient.get<EpisodeServers>(
        `${this.baseUrl}/anime/episode/servers`,
        {
          params: {
            episodeId,
          },
        }
      );

      logger.info(
        `[Aniwatch] Successfully fetched servers for episode: ${episodeId} (sub: ${response.data.sub.length}, dub: ${response.data.dub.length})`
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<AniwatchError>;

      if (axiosError.response?.status === 404) {
        logger.warn(`[Aniwatch] Episode not found: ${episodeId}`);
        throw new Error(`Episode ${episodeId} not found on streaming server`);
      }

      if (axiosError.code === 'ECONNREFUSED') {
        logger.error(`[Aniwatch] Cannot connect to API server at ${this.baseUrl}`);
        throw new Error(
          `Aniwatch API server is not running. Please start the server at ${this.baseUrl}`
        );
      }

      logger.error(`[Aniwatch] Failed to fetch servers for episode ${episodeId}:`, error);
      throw new Error(`Failed to fetch episode servers: ${axiosError.message || 'Unknown error'}`);
    }
  }

  /**
   * Get all episodes for an anime
   *
   * @param animeId - HiAnime anime identifier (e.g., "100")
   * @returns Anime episodes list with metadata
   * @throws Error if API request fails or anime not found
   *
   * @example
   * const episodes = await client.getAnimeEpisodes("100");
   * // Returns: { totalEpisodes: 1000, episodes: [...] }
   */
  async getAnimeEpisodes(animeId: string): Promise<AnimeEpisodes> {
    try {
      logger.info(`[Aniwatch] Fetching episodes list for anime: ${animeId}`);

      const response = await httpClient.get<AnimeEpisodes>(
        `${this.baseUrl}/anime/episodes/${animeId}`
      );

      logger.info(
        `[Aniwatch] Successfully fetched ${response.data.totalEpisodes} episodes for anime: ${animeId}`
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<AniwatchError>;

      if (axiosError.response?.status === 404) {
        logger.warn(`[Aniwatch] Anime not found: ${animeId}`);
        throw new Error(`Anime ${animeId} not found on streaming server`);
      }

      if (axiosError.code === 'ECONNREFUSED') {
        logger.error(`[Aniwatch] Cannot connect to API server at ${this.baseUrl}`);
        throw new Error(
          `Aniwatch API server is not running. Please start the server at ${this.baseUrl}`
        );
      }

      logger.error(`[Aniwatch] Failed to fetch episodes for anime ${animeId}:`, error);
      throw new Error(`Failed to fetch anime episodes: ${axiosError.message || 'Unknown error'}`);
    }
  }

  buildEpisodeId(animeId: string, episodeNumber: number): string {
    const episodeId = `${animeId}?ep=${episodeNumber}`;
    logger.debug(`[Aniwatch] Built episode ID: ${episodeId}`);
    return episodeId;
  }

  async isServerRunning(): Promise<boolean> {
    try {
      await httpClient.get(`${this.baseUrl}/anime/episodes/100`, {
        timeout: 3000,
      });
      logger.info(`[Aniwatch] Server is running at ${this.baseUrl}`);
      return true;
    } catch {
      logger.warn(`[Aniwatch] Server is not reachable at ${this.baseUrl}`);
      return false;
    }
  }

  getAvailableServers(): readonly string[] {
    return STREAMING_SERVERS;
  }

  getAvailableCategories(): readonly string[] {
    return AUDIO_CATEGORIES;
  }
}

export default AniwatchClient;
