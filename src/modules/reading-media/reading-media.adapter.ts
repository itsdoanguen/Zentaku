/**
 * Reading Media Adapter
 *
 * @module ReadingMediaAdapter
 */

import type { ReadingMediaItem } from '../../entities';
import type { Tag } from '../../infrastructure/external/anilist/anilist.types';
import type {
  ReadingMediaInfo,
  ReadingMediaLightweight,
} from '../../infrastructure/external/anilist/reading-media/anilist-reading-media.types';

interface TypeORMReadingMediaCreateData {
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

  format?: string | null;
  chapters?: number | null;
  volumes?: number | null;
  author?: Array<{ name: string; role: string }> | null;
}

interface ReadingMediaResponse {
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
  format: string | null;
  mediaCategory: 'manga' | 'novel';
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
  chapters: number | null;
  volumes: number | null;
  author: Array<{ name: string; role: string }> | null;
  lastSyncedAt: string | null;
}

interface ReadingMediaResponseMinimal {
  idAnilist: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: string | null;
  chapters: number | null;
  volumes: number | null;
  format: string | null;
  mediaCategory: 'manga' | 'novel';
  score: number | null;
  status: string;
}

class ReadingMediaAdapter {
  // ============================================
  // ANILIST API → DATABASE FORMAT
  // ============================================

  /**
   * Transform AniList GraphQL response to TypeORM ReadingMediaItem format
   *
   * @param externalData - Raw data from AniList GraphQL API
   * @returns Data formatted for TypeORM upsert operation
   * @throws {Error} If required fields are missing
   */
  fromExternal(externalData: ReadingMediaInfo): TypeORMReadingMediaCreateData {
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

      // Reading media specific fields
      format: externalData.format || null,
      chapters: externalData.chapters || null,
      volumes: externalData.volumes || null,
      author: null, // Not available in basic AniList query
    };
  }

  /**
   * Transform AniList lightweight data
   * @param externalData - Lightweight AniList data
   * @returns Minimal data for TypeORM operations
   */
  fromAnilistLightweight(
    externalData: ReadingMediaLightweight
  ): Partial<TypeORMReadingMediaCreateData> {
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
      format: externalData.format || null,
      chapters: externalData.chapters || null,
      volumes: externalData.volumes || null,
    };
  }

  // ============================================
  // DATABASE → API RESPONSE FORMAT
  // ============================================

  /**
   * Transform TypeORM ReadingMediaItem to API response format
   * @param mediaModel - TypeORM ReadingMediaItem entity
   * @returns Formatted API response or null if input is null
   */
  toResponse(mediaModel: ReadingMediaItem | null): ReadingMediaResponse | null {
    if (!mediaModel) {
      return null;
    }
    if (!mediaModel.idAnilist) {
      throw new Error('Invalid ReadingMedia model: missing idAnilist field');
    }

    return {
      idAnilist: mediaModel.idAnilist,
      malId: mediaModel.idMal ?? null,

      title: {
        romaji: mediaModel.titleRomaji,
        english: mediaModel.titleEnglish ?? null,
        native: mediaModel.titleNative ?? null,
      },

      coverImage: mediaModel.coverImage ?? null,
      bannerImage: mediaModel.bannerImage ?? null,

      type: 'MANGA', // AniList API type
      format: mediaModel.format ?? null,
      mediaCategory: this.getMediaCategory(mediaModel.format),

      status: mediaModel.status,
      isAdult: mediaModel.isAdult,

      score: mediaModel.averageScore ?? null,
      meanScore: mediaModel.meanScore ?? null,

      description: mediaModel.description ?? null,

      synonyms: mediaModel.synonyms as string[] | null,
      genres: mediaModel.genres as string[] | null,
      tags: mediaModel.tags as Tag[] | null,
      popularity: mediaModel.popularity ?? null,
      favorites: mediaModel.favorites ?? null,

      chapters: mediaModel.chapters ?? null,
      volumes: mediaModel.volumes ?? null,
      author: mediaModel.author ?? null,

      lastSyncedAt: this._formatDate(mediaModel.lastSyncedAt),
    };
  }

  /**
   * Transform array of TypeORM ReadingMediaItem entities to API response format
   *
   * @param mediaList - Array of TypeORM ReadingMediaItem entities
   * @returns Array of formatted API responses
   */
  toResponseList(mediaList: ReadingMediaItem[]): ReadingMediaResponse[] {
    if (!Array.isArray(mediaList)) {
      return [];
    }

    return mediaList
      .map((media) => this.toResponse(media))
      .filter((media): media is ReadingMediaResponse => media !== null);
  }

  /**
   * Transform for lightweight list responses (cards, previews)
   *
   * @param mediaModel - TypeORM ReadingMediaItem entity
   * @returns Minimal response object or null
   */
  toResponseMinimal(mediaModel: ReadingMediaItem | null): ReadingMediaResponseMinimal | null {
    if (!mediaModel) {
      return null;
    }
    if (!mediaModel.idAnilist) {
      throw new Error('Invalid ReadingMedia model: missing idAnilist field');
    }

    return {
      idAnilist: mediaModel.idAnilist,
      title: {
        romaji: mediaModel.titleRomaji,
        english: mediaModel.titleEnglish ?? null,
      },
      coverImage: mediaModel.coverImage ?? null,
      chapters: mediaModel.chapters ?? null,
      volumes: mediaModel.volumes ?? null,
      format: mediaModel.format ?? null,
      mediaCategory: this.getMediaCategory(mediaModel.format),
      score: mediaModel.averageScore ?? null,
      status: mediaModel.status,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Determine media category from format field
   *
   * @param format - MediaFormat value from database
   * @returns 'manga' | 'novel'
   */
  getMediaCategory(format: string | null | undefined): 'manga' | 'novel' {
    const novelFormats = ['NOVEL'];
    return novelFormats.includes(format || '') ? 'novel' : 'manga';
  }

  /**
   * Normalize AniList score (0-100) to application scale (0-10)
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
   * @private
   * @param coverImage - Cover image object from AniList
   * @returns Best quality cover URL or null
   */
  private _extractCoverImage(
    coverImage: { large?: string; medium?: string } | undefined
  ): string | null {
    if (!coverImage) {
      return null;
    }

    return coverImage.large || null;
  }

  /**
   * Clean HTML tags from description text
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

  private _formatDate(date: Date | null | undefined): string | null {
    if (!date) {
      return null;
    }

    return date.toISOString();
  }
}

export default ReadingMediaAdapter;
