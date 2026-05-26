import logger from '../../../shared/utils/logger';
import type { FilmServerEpisodeSource } from './filmserver.types';

class FilmServerClient {
  private readonly baseUrl: string;
  private readonly availableAnimeIds: Set<number>;

  constructor() {
    const configuredBaseUrl = process.env.FILMSERVER_BASE_URL?.trim();
    this.baseUrl = configuredBaseUrl ? configuredBaseUrl.replace(/\/+$/, '') : '';

    const idsRaw = process.env.FILMSERVER_ANIME_IDS || '';
    this.availableAnimeIds = new Set(
      idsRaw
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    );

    logger.info(
      `[FilmServerClient] Initialized with base URL: ${this.baseUrl || '(not configured)'}, ` +
        `anime IDs: [${Array.from(this.availableAnimeIds).join(', ')}]`
    );
  }

  hasAnime(anilistId: number): boolean {
    return this.availableAnimeIds.has(anilistId) && this.baseUrl.length > 0;
  }

  getEpisodeSource(anilistId: number, episodeNumber: number): FilmServerEpisodeSource {
    const epStr = String(episodeNumber).padStart(2, '0');
    return {
      streamUrl: `${this.baseUrl}/movies/${anilistId}/${epStr}/index.m3u8`,
      subtitleUrl: `${this.baseUrl}/movies/${anilistId}/${epStr}/${epStr}.vtt`,
    };
  }

  getAvailableEpisodeCount(anilistId: number): number {
    // Episode count per anime — default fallback used when count is unknown.
    // To support dynamic detection, this could be replaced with a discovery
    // endpoint on FilmServer or a config map keyed by anime ID.
    const EPISODE_COUNT_MAP: Record<number, number> = {
      108941: 12,
      178022: 12,
    };

    return EPISODE_COUNT_MAP[anilistId] ?? 12;
  }

  getAvailableAnimeIds(): number[] {
    return Array.from(this.availableAnimeIds);
  }
}

export default FilmServerClient;
