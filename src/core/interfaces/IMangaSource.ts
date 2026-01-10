/**
 * Manga Source Interface
 *
 * Defines the contract for manga chapter/page sources.
 * Implementations provide manga content from external sources like MangaDex.
 *
 * Responsibilities:
 * - Get available chapters list
 * - Get page image links for each chapter
 * - Get scanlation groups information
 * - Get chapter language information
 * - Search manga in source for ID mapping
 */

/**
 * Manga basic information
 */
export interface MangaInfo {
  id: string;
  title: string;
  altTitles?: string[];
  description?: string;
  coverUrl?: string;
  status?: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  year?: number;
  authors?: string[];
  artists?: string[];
  genres?: string[];
}

/**
 * Chapter information
 */
export interface ChapterInfo {
  id: string;
  mangaId: string;
  number: number | string;
  title?: string;
  volume?: number | string;
  language: string;
  pageCount: number;
  publishedAt?: Date;
  scanlationGroup?: {
    id: string;
    name: string;
  };
  externalUrl?: string;
}

/**
 * Manga page information
 */
export interface MangaPage {
  pageNumber: number;
  imageUrl: string;
  width?: number;
  height?: number;
}

/**
 * Chapter with pages
 */
export interface ChapterWithPages extends Omit<ChapterInfo, 'pageCount'> {
  pages: MangaPage[];
}

/**
 * Search result
 */
export interface MangaSearchResult {
  id: string;
  title: string;
  coverUrl?: string;
  description?: string;
  status?: string;
  year?: number;
  relevance?: number;
}

/**
 * Search options
 */
export interface MangaSearchOptions {
  limit?: number;
  offset?: number;
  language?: string;
  includedTags?: string[];
  excludedTags?: string[];
  status?: string[];
  sortBy?: 'relevance' | 'rating' | 'followedCount' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

/**
 * Manga Source Interface
 * All manga source implementations must follow this contract
 */
export interface IMangaSource {
  /**
   * Source name (e.g., 'MangaDex', 'MangaPlus')
   */
  readonly sourceName: string;

  /**
   * Search manga in source to get ID mapping
   * (Since AniList ID differs from source ID, need to search for mapping)
   *
   * @param query - Manga title to search
   * @param options - Search options
   * @returns Search results
   *
   * @example
   * const results = await source.searchManga('One Piece', { limit: 10 });
   */
  searchManga(query: string, options?: MangaSearchOptions): Promise<MangaSearchResult[]>;

  /**
   * Get basic manga information from source
   *
   * @param mangaId - Manga ID in this source
   * @returns Manga information
   */
  getMangaInfo(mangaId: string): Promise<MangaInfo>;

  /**
   * Get list of available chapters for a manga
   *
   * @param mangaId - Manga ID in this source
   * @param options - Filter options (language, volume, etc.)
   * @returns List of chapters
   *
   * @example
   * const chapters = await source.getChapters('uuid-123', { language: 'en' });
   */
  getChapters(
    mangaId: string,
    options?: {
      language?: string;
      volume?: number | string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ChapterInfo[]>;

  /**
   * Get page image URLs for a specific chapter
   *
   * @param chapterId - Chapter ID in this source
   * @returns List of page URLs
   *
   * @example
   * const pages = await source.getChapterPages('chapter-uuid');
   */
  getChapterPages(chapterId: string): Promise<MangaPage[]>;

  /**
   * Get chapter with pages in one call
   *
   * @param chapterId - Chapter ID
   * @returns Chapter information with pages
   */
  getChapterWithPages(chapterId: string): Promise<ChapterWithPages>;

  /**
   * Get scanlation group information
   *
   * @param groupId - Scanlation group ID
   * @returns Group information
   */
  getScanlationGroup?(groupId: string): Promise<{
    id: string;
    name: string;
    website?: string;
    description?: string;
  }>;

  /**
   * Map AniList manga ID to source manga ID
   * This is a helper for ID conversion
   *
   * @param anilistId - AniList manga ID
   * @returns Source manga ID or null if not found
   */
  mapFromAnilistId?(anilistId: number): Promise<string | null>;
}

/**
 * Abstract base class for manga sources
 * Provides common functionality
 */
export abstract class BaseMangaSource implements IMangaSource {
  abstract readonly sourceName: string;

  abstract searchManga(query: string, options?: MangaSearchOptions): Promise<MangaSearchResult[]>;

  abstract getMangaInfo(mangaId: string): Promise<MangaInfo>;

  abstract getChapters(
    mangaId: string,
    options?: {
      language?: string;
      volume?: number | string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ChapterInfo[]>;

  abstract getChapterPages(chapterId: string): Promise<MangaPage[]>;

  /**
   * Default implementation: get chapter info + pages
   */
  async getChapterWithPages(_chapterId: string): Promise<ChapterWithPages> {
    // Would need to fetch chapter info separately and combine with pages
    // This is a simplified implementation - subclasses should override
    throw new Error('getChapterWithPages must be implemented in subclass');
  }
}
