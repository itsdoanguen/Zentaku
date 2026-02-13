import type { MangaItem } from '../../entities';
import type { CoverImage, Tag } from '../../infrastructure/external/anilist/anilist.types';
import type {
  MangaInfo,
  MangaLightweight,
} from '../../infrastructure/external/anilist/manga/anilist-manga.types';

interface TypeORMMangaCreateData {
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
  chapters?: number | null;
  volumes?: number | null;
  author?: Array<{ name: string; role: string }> | null;
  serialization?: string | null;
}

interface MangaResponse {
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
  chapters: number | null;
  volumes: number | null;
  author: Array<{ name: string; role: string }> | null;
  serialization: string | null;
  lastSyncedAt: string | null;
}

interface MangaResponseMinimal {
  idAnilist: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: string | null;
  chapters: number | null;
  score: number | null;
  status: string;
}

class MangaAdapter {
  fromExternal(externalData: MangaInfo): TypeORMMangaCreateData {
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

      chapters: externalData.chapters || null,
      volumes: externalData.volumes || null,
      author: null,
      serialization: null,
    };
  }

  fromAnilistLightweight(externalData: MangaLightweight): Partial<TypeORMMangaCreateData> {
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
      chapters: externalData.chapters || null,
      volumes: externalData.volumes || null,
    };
  }

  toResponse(mangaModel: MangaItem | null): MangaResponse | null {
    if (!mangaModel) {
      return null;
    }
    if (!mangaModel.idAnilist) {
      throw new Error('Invalid Manga model: missing idAnilist field');
    }

    return {
      idAnilist: mangaModel.idAnilist,
      malId: mangaModel.idMal ?? null,

      title: {
        romaji: mangaModel.titleRomaji,
        english: mangaModel.titleEnglish ?? null,
        native: mangaModel.titleNative ?? null,
      },

      coverImage: mangaModel.coverImage ?? null,
      bannerImage: mangaModel.bannerImage ?? null,

      type: 'MANGA',
      status: mangaModel.status,
      isAdult: mangaModel.isAdult,

      score: mangaModel.averageScore ?? null,
      meanScore: mangaModel.meanScore ?? null,

      description: mangaModel.description ?? null,

      synonyms: mangaModel.synonyms as string[] | null,
      genres: mangaModel.genres as string[] | null,
      tags: mangaModel.tags as Tag[] | null,
      popularity: mangaModel.popularity ?? null,
      favorites: mangaModel.favorites ?? null,

      chapters: mangaModel.chapters ?? null,
      volumes: mangaModel.volumes ?? null,
      author: mangaModel.author ?? null,
      serialization: mangaModel.serialization ?? null,

      lastSyncedAt: this._formatDate(mangaModel.lastSyncedAt),
    };
  }

  toResponseList(mangaList: MangaItem[]): MangaResponse[] {
    if (!Array.isArray(mangaList)) {
      return [];
    }

    return mangaList
      .map((manga) => this.toResponse(manga))
      .filter((manga): manga is MangaResponse => manga !== null);
  }

  toResponseMinimal(mangaModel: MangaItem | null): MangaResponseMinimal | null {
    if (!mangaModel) {
      return null;
    }
    if (!mangaModel.idAnilist) {
      throw new Error('Invalid Manga model: missing idAnilist field');
    }

    return {
      idAnilist: mangaModel.idAnilist,
      title: {
        romaji: mangaModel.titleRomaji,
        english: mangaModel.titleEnglish ?? null,
      },
      coverImage: mangaModel.coverImage ?? null,
      chapters: mangaModel.chapters ?? null,
      score: mangaModel.averageScore ?? null,
      status: mangaModel.status,
    };
  }

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

  private _extractCoverImage(coverImage: CoverImage | undefined): string | null {
    if (!coverImage) {
      return null;
    }

    return coverImage.large || null;
  }

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

export default MangaAdapter;
