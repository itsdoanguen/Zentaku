/**
 * Anime Adapter
 *
 * Transforms data between different representations:
 * - AniList API GraphQL response → TypeORM Entity format
 * - TypeORM Entity → API Response format
 *
 * @module AnimeAdapter
 */

import type { AnimeItem } from '../../entities';
import type {
  CoverImage,
  Studio,
  Tag,
  Trailer,
} from '../../infrastructure/external/anilist/anilist.types';
import type {
  AnimeInfo,
  AnimeLightweight,
} from '../../infrastructure/external/anilist/anime/anilist-anime.types';

/**
 * Data structure for TypeORM create/upsert operations
 */
interface TypeORMAnimeCreateData {
  idAnilist: number;
  idMal?: number | null;
  lastSyncedAt?: Date;
  titleRomaji: string;
  titleEnglish?: string | null;
  titleNative?: string | null;
  status: 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED';
  coverImage?: string | null;
  bannerImage?: string | null;
  isAdult?: boolean;
  averageScore?: number | null;
  description?: string | null;
  synonyms?: string[] | null;
  genres?: string[] | null;
  tags?: Tag[] | null;
  popularity?: number | null;
  favorites?: number | null;
  meanScore?: number | null;
  // Anime-specific fields
  episodeCount?: number | null;
  durationMin?: number | null;
  season?: string | null;
  seasonYear?: number | null;
  studio?: string | null;
  source?: string | null;
  trailerUrl?: string | null;
  nextAiringEpisode?: object | null;
}

/**
 * API Response format
 */
interface AnimeResponse {
  idAnilist: number;
  malId: number | null;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  coverImage: string | null;
  bannerImage: string | null;
  type: string;
  status: string;
  isAdult: boolean;
  score: number | null;
  meanScore: number | null;
  description: string | null;
  synonyms: string[] | null;
  genres: string[] | null;
  tags: Tag[] | null;
  popularity: number | null;
  favorites: number | null;
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  studio: string | null;
  source: string | null;
  trailerUrl: string | null;
  nextAiringEpisode: object | null;
  lastSyncedAt: string | null;
}

/**
 * Minimal response for lists/cards
 */
interface AnimeResponseMinimal {
  idAnilist: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: string | null;
  episodes: number | null;
  score: number | null;
  status: string;
}

class AnimeAdapter {
  // ============================================
  // ANILIST API → DATABASE FORMAT
  // ============================================

  /**
   * Transform AniList GraphQL response to TypeORM AnimeItem format
   *
   * This method prepares data for TypeORM's create/update operations.
   * All fields are flattened (no nested metadata object).
   *
   * @param externalData - Raw data from AniList GraphQL API
   * @returns Data formatted for TypeORM upsert operation
   * @throws {Error} If required fields are missing
   *
   * @example
   * const externalData = await anilistClient.fetchById(1);
   * const dbData = animeAdapter.fromExternal(externalData);
   * await animeRepo.upsertAnime(dbData);
   */
  fromExternal(externalData: AnimeInfo): TypeORMAnimeCreateData {
    if (!externalData || !externalData.id) {
      throw new Error('Invalid AniList data: missing required id field');
    }

    return {
      idAnilist: externalData.id,
      idMal: externalData.idMal || null,
      lastSyncedAt: new Date(),

      titleRomaji: externalData.title?.romaji || 'Unknown Title',
      titleEnglish: externalData.title?.english || null,
      titleNative: externalData.title?.native || null,

      status: this._mapAnilistStatus(externalData.status),

      coverImage: this._extractCoverImage(externalData.coverImage),
      bannerImage: externalData.bannerImage || null,

      isAdult: externalData.isAdult || false,
      averageScore: this._normalizeScore(externalData.averageScore),
      meanScore: this._normalizeScore(externalData.meanScore),
      description: this._cleanDescription(externalData.description),

      synonyms: externalData.synonyms || null,
      genres: externalData.genres || null,
      tags: externalData.tags || null,
      popularity: externalData.popularity || null,
      favorites: externalData.favourites || null,

      episodeCount: externalData.episodes || null,
      durationMin: externalData.duration || null,
      season: externalData.season || null,
      seasonYear: externalData.seasonYear || null,
      studio: this._extractStudio(externalData.studios),
      source: externalData.source || null,
      trailerUrl: this._buildTrailerUrl(externalData.trailer),
      nextAiringEpisode: externalData.nextAiringEpisode || null,
    };
  }

  /**
   * Transform AniList lightweight data
   *
   * Used when fetching multiple anime at once or when only
   * basic information is needed
   *
   * @param externalData - Lightweight AniList data
   * @returns Minimal data for TypeORM operations
   * @throws {Error} If required fields are missing
   */
  fromAnilistLightweight(externalData: AnimeLightweight): Partial<TypeORMAnimeCreateData> {
    if (!externalData || !externalData.id) {
      throw new Error('Invalid AniList data: missing required id field');
    }

    return {
      idAnilist: externalData.id,
      titleRomaji: externalData.title?.romaji || 'Unknown Title',
      titleEnglish: externalData.title?.english || null,
      titleNative: externalData.title?.native || null,
      coverImage: this._extractCoverImage(externalData.coverImage),
      lastSyncedAt: new Date(),
      episodeCount: externalData.episodes || null,
      nextAiringEpisode: externalData.nextAiringEpisode || null,
    };
  }

  // ============================================
  // DATABASE → API RESPONSE FORMAT
  // ============================================

  /**
   * Transform TypeORM AnimeItem to API response format
   *
   * This method creates a clean, client-friendly response by:
   * - Flattening fields (anime-specific fields are directly on entity)
   * - Renaming fields for consistency
   * - Formatting dates and scores
   * - Removing internal database fields
   *
   * @param animeModel - TypeORM AnimeItem entity
   * @returns Formatted API response or null if input is null
   *
   * @example
   * const anime = await animeRepo.findByAnilistId(1);
   * const response = animeAdapter.toResponse(anime);
   */
  toResponse(animeModel: AnimeItem | null): AnimeResponse | null {
    if (!animeModel) {
      return null;
    }
    if (!animeModel.idAnilist) {
      throw new Error('Invalid Anime model: missing idAnilist field');
    }

    return {
      idAnilist: animeModel.idAnilist,
      malId: animeModel.idMal ?? null,

      title: {
        romaji: animeModel.titleRomaji,
        english: animeModel.titleEnglish ?? null,
        native: animeModel.titleNative ?? null,
      },

      coverImage: animeModel.coverImage ?? null,
      bannerImage: animeModel.bannerImage ?? null,

      type: 'ANIME',
      status: animeModel.status,
      isAdult: animeModel.isAdult,

      score: animeModel.averageScore ?? null,
      meanScore: animeModel.meanScore ?? null,

      description: animeModel.description ?? null,

      synonyms: animeModel.synonyms as string[] | null,
      genres: animeModel.genres as string[] | null,
      tags: animeModel.tags as Tag[] | null,
      popularity: animeModel.popularity ?? null,
      favorites: animeModel.favorites ?? null,

      episodes: animeModel.episodeCount ?? null,
      duration: animeModel.durationMin ?? null,
      season: animeModel.season ?? null,
      seasonYear: animeModel.seasonYear ?? null,
      studio: animeModel.studio ?? null,
      source: animeModel.source ?? null,
      trailerUrl: animeModel.trailerUrl ?? null,
      nextAiringEpisode: (animeModel.nextAiringEpisode as object | null) ?? null,

      lastSyncedAt: this._formatDate(animeModel.lastSyncedAt),
    };
  }

  /**
   * Transform array of TypeORM AnimeItem entities to API response format
   *
   * Efficiently maps multiple anime entities using toResponse().
   * Filters out any null results.
   *
   * @param animeList - Array of TypeORM AnimeItem entities
   * @returns Array of formatted API responses
   *
   * @example
   * const animeList = await animeRepo.findAiring();
   * const response = animeAdapter.toResponseList(animeList);
   */
  toResponseList(animeList: AnimeItem[]): AnimeResponse[] {
    if (!Array.isArray(animeList)) {
      return [];
    }

    return animeList
      .map((anime) => this.toResponse(anime))
      .filter((anime): anime is AnimeResponse => anime !== null);
  }

  /**
   * Transform for lightweight list responses (cards, previews)
   *
   * Returns minimal data for list views to reduce payload size.
   *
   * @param animeModel - TypeORM AnimeItem entity
   * @returns Minimal response object or null
   */
  toResponseMinimal(animeModel: AnimeItem | null): AnimeResponseMinimal | null {
    if (!animeModel) {
      return null;
    }
    if (!animeModel.idAnilist) {
      throw new Error('Invalid Anime model: missing idAnilist field');
    }

    return {
      idAnilist: animeModel.idAnilist,
      title: {
        romaji: animeModel.titleRomaji,
        english: animeModel.titleEnglish ?? null,
      },
      coverImage: animeModel.coverImage ?? null,
      episodes: animeModel.episodeCount ?? null,
      score: animeModel.averageScore ?? null,
      status: animeModel.status,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Normalize AniList score (0-100) to application scale (0-10)
   *
   * AniList uses a 0-100 scale, but we store as 0-10 for consistency
   * with other rating systems (MAL uses 1-10).
   *
   * @private
   * @param anilistScore - Score from AniList (0-100)
   * @returns Normalized score (0-10) or null
   */
  private _normalizeScore(anilistScore: number | null | undefined): number | null {
    if (anilistScore === null || anilistScore === undefined) {
      return null;
    }

    const score = parseFloat(String(anilistScore));

    if (isNaN(score) || score < 0 || score > 100) {
      return null;
    }

    return Math.round(score) / 10;
  }

  /**
   * Map AniList status enum to TypeORM MediaStatus enum
   *
   * Ensures compatibility between AniList's status values
   * and our database schema.
   *
   * @private
   * @param anilistStatus - Status from AniList API
   * @returns Mapped status for TypeORM enum
   */
  private _mapAnilistStatus(
    anilistStatus: string | undefined
  ): 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED' {
    const statusMap: Record<string, 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED'> = {
      RELEASING: 'RELEASING',
      FINISHED: 'FINISHED',
      NOT_YET_RELEASED: 'NOT_YET_RELEASED',
      CANCELLED: 'CANCELLED',
    };

    return statusMap[anilistStatus || ''] || 'NOT_YET_RELEASED';
  }

  /**
   * Extract cover image URL with fallback priority
   *
   * Priority: extraLarge > large > medium > null
   *
   * @private
   * @param coverImage - Cover image object from AniList
   * @returns Best quality cover URL or null
   */
  private _extractCoverImage(coverImage: CoverImage | undefined): string | null {
    if (!coverImage) {
      return null;
    }

    return coverImage.large || null;
  }

  /**
   * Extract primary studio name from studios object
   *
   * AniList returns studios as a nested object with nodes array.
   * We take the first studio as the primary one.
   *
   * @private
   * @param studios - Studios object from AniList
   * @returns Primary studio name or null
   */
  private _extractStudio(studios: { nodes: Studio[] } | undefined): string | null {
    if (!studios) {
      return null;
    }

    const studioList = studios.nodes;

    if (Array.isArray(studioList) && studioList.length > 0) {
      return studioList[0]?.name || null;
    }

    return null;
  }

  /**
   * Build complete trailer URL from AniList trailer object
   *
   * Supports YouTube and Dailymotion.
   *
   * @private
   * @param trailer - Trailer object from AniList
   * @returns Complete trailer URL or null
   */
  private _buildTrailerUrl(trailer: Trailer | undefined): string | null {
    if (!trailer || !trailer.id) {
      return null;
    }

    const siteLower = trailer.site?.toLowerCase();

    const siteMap: Record<string, string> = {
      youtube: `https://www.youtube.com/watch?v=${trailer.id}`,
      dailymotion: `https://www.dailymotion.com/video/${trailer.id}`,
    };

    return siteMap[siteLower] || null;
  }

  /**
   * Clean HTML tags from description text
   *
   * AniList returns descriptions with HTML formatting.
   * This method:
   * - Converts <br> tags to newlines
   * - Strips all other HTML tags
   * - Trims whitespace
   *
   * @private
   * @param description - HTML description from AniList
   * @returns Cleaned plain text or null
   */
  private _cleanDescription(description: string | undefined): string | null {
    if (!description) {
      return null;
    }

    return description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  /**
   * Format Date object to ISO 8601 string
   *
   * @private
   * @param date - Date object
   * @returns ISO 8601 formatted date string or null
   */
  private _formatDate(date: Date | null | undefined): string | null {
    if (!date) {
      return null;
    }

    return date.toISOString();
  }
}

export default AnimeAdapter;
