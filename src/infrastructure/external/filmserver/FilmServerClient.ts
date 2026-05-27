import logger from '../../../shared/utils/logger';
import type { FilmServerEpisodeSource } from './filmserver.types';
import axios from 'axios';

class FilmServerClient {
  private readonly baseUrl: string;
  private cachedMovies: Record<number, number> = {};
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor() {
    const configuredBaseUrl = process.env.FILMSERVER_BASE_URL?.trim();
    this.baseUrl = configuredBaseUrl ? configuredBaseUrl.replace(/\/+$/, '') : '';

    logger.info(
      `[FilmServerClient] Initialized with base URL: ${this.baseUrl || '(not configured)'}`
    );
  }

  private async fetchMovies(): Promise<void> {
    if (!this.baseUrl) return;

    // Check if cache is still valid
    if (Date.now() - this.lastFetchTime < this.CACHE_TTL) {
      return;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/movies`, { timeout: 3000 });
      if (response.data?.success && response.data?.movies) {
        this.cachedMovies = response.data.movies;
        this.lastFetchTime = Date.now();
      }
    } catch (err: any) {
      logger.error(`[FilmServerClient] Failed to fetch movies from FilmServer: ${err.message}`);
      // Keep using old cache if failed
    }
  }

  async hasAnime(anilistId: number): Promise<boolean> {
    if (!this.baseUrl) return false;
    await this.fetchMovies();
    return this.cachedMovies[anilistId] !== undefined;
  }

  getEpisodeSource(anilistId: number, episodeNumber: number): FilmServerEpisodeSource {
    const epStr = String(episodeNumber).padStart(2, '0');
    return {
      streamUrl: `${this.baseUrl}/movies/${anilistId}/${epStr}/index.m3u8`,
      subtitleUrl: `${this.baseUrl}/movies/${anilistId}/${epStr}/${epStr}.vtt`,
    };
  }

  async getAvailableEpisodeCount(anilistId: number): Promise<number> {
    await this.fetchMovies();
    return this.cachedMovies[anilistId] ?? 12;
  }

  async getAvailableAnimeIds(): Promise<number[]> {
    await this.fetchMovies();
    return Object.keys(this.cachedMovies).map(Number);
  }
}

export default FilmServerClient;
