/**
 * Base Media Repository
 *
 * Specialized repository for MediaItem entities with inheritance pattern.
 * Handles common operations for anime, manga, and novel repositories.
 *
 * Features:
 * - Automatic metadata inclusion
 * - AniList/MAL ID lookups
 * - Sync status management
 * - Media type filtering
 *
 * The MediaItem uses Single Table Inheritance pattern where:
 * - MediaItem is the base table
 * - AnimeMetadata, BookMetadata are optional 1-1 relations
 * - Type field discriminates between ANIME, MANGA, NOVEL
 *
 * @extends BaseRepository
 */

import type { PrismaClient } from '@prisma/client';
import { BaseRepository, type FindManyOptions, type FindOneOptions } from './BaseRepository';

/**
 * Media search options
 */
export interface MediaSearchOptions extends Omit<FindManyOptions, 'where'> {
  limit?: number;
}

/**
 * Top rated options
 */
export interface TopRatedOptions extends MediaSearchOptions {
  minScore?: number;
}

/**
 * Base Media Repository Abstract Class
 */
export abstract class BaseMediaRepository<T = unknown> extends BaseRepository<T, 'mediaItem'> {
  protected readonly metadataRelation: string;

  /**
   * Create a media repository instance
   *
   * @param prisma - Prisma client instance
   * @param metadataRelation - Name of metadata relation (e.g., 'animeMetadata', 'bookMetadata')
   * @throws {Error} If metadata relation name is not provided
   */
  constructor(prisma: PrismaClient, metadataRelation: string) {
    super(prisma, 'mediaItem');

    if (!metadataRelation) {
      throw new Error('Metadata relation name is required for MediaRepository');
    }

    this.metadataRelation = metadataRelation;
  }

  // ============================================
  // PROTECTED HELPERS
  // ============================================

  /**
   * Get default include for media queries
   *
   * Automatically includes the specific metadata relation.
   * Override this method in child classes if different include is needed.
   *
   * @protected
   * @returns Include object for Prisma queries
   */
  protected _getDefaultInclude(): Record<string, boolean> {
    return {
      [this.metadataRelation]: true,
    };
  }

  /**
   * Merge user-provided options with default include
   *
   * @protected
   * @param options - User-provided options
   * @returns Merged options
   */
  protected _mergeWithDefaultInclude(options: FindOneOptions = {}): FindOneOptions {
    if (options.include) {
      // User provided custom include, respect it
      return options;
    }

    return {
      ...options,
      include: this._getDefaultInclude(),
    };
  }

  // ============================================
  // PROTECTED GENERIC METHODS FOR EXTERNAL IDS
  // ============================================

  /**
   * Generic method to find media by external ID field
   *
   * This is a protected helper method. Child classes should implement
   * public methods that call this (e.g., findByAnilistId, findByMalId).
   *
   * @protected
   * @param fieldName - Name of the ID field (e.g., 'idAnilist', 'idMal', 'idMangadex')
   * @param value - ID value
   * @param options - Additional query options
   * @returns Media item or null if not found
   *
   * @example
   * // In AnimeRepository:
   * async findByAnilistId(anilistId: number, options = {}) {
   *   return this._findByExternalId('idAnilist', anilistId, options);
   * }
   */
  protected async _findByExternalId(
    fieldName: string,
    value: number | string,
    options: FindOneOptions = {}
  ): Promise<T | null> {
    return this.findOne({ [fieldName]: value }, this._mergeWithDefaultInclude(options));
  }

  /**
   * Generic method to find multiple media by external ID field
   *
   * This is a protected helper method. Child classes should implement
   * public batch methods that call this (e.g., findByAnilistIds).
   *
   * @protected
   * @param fieldName - Name of the ID field (e.g., 'idAnilist', 'idMal')
   * @param values - Array of ID values
   * @param options - Additional query options
   * @returns Array of media items
   *
   * @example
   * // In AnimeRepository:
   * async findByAnilistIds(anilistIds: number[], options = {}) {
   *   return this._findByExternalIds('idAnilist', anilistIds, options);
   * }
   */
  protected async _findByExternalIds(
    fieldName: string,
    values: Array<number | string>,
    options: FindOneOptions = {}
  ): Promise<T[]> {
    if (!Array.isArray(values) || values.length === 0) {
      return [];
    }

    return this.findMany({
      where: {
        [fieldName]: { in: values },
      },
      ...this._mergeWithDefaultInclude(options),
    });
  }

  // ============================================
  // SYNC STATUS MANAGEMENT
  // ============================================

  /**
   * Check if media should be synced from external source
   *
   * Returns true if:
   * - Media doesn't exist (null)
   * - Media never been synced (lastSyncedAt is null)
   * - Last sync was older than threshold
   *
   * @param media - Media object from database
   * @param thresholdDays - Number of days before re-sync
   * @returns True if sync is needed
   *
   * @example
   * const anime = await animeRepo.findByAnilistId(1);
   * if (animeRepo.shouldSync(anime, 7)) {
   *   // Fetch fresh data from AniList
   * }
   */
  shouldSync(media: T | null | { lastSyncedAt?: Date | null }, thresholdDays = 7): boolean {
    // No media exists
    if (!media) {
      return true;
    }

    // Type guard to check if media is an object
    if (typeof media !== 'object') {
      return true;
    }

    // Type guard to check if media has lastSyncedAt property
    if (!('lastSyncedAt' in media)) {
      return true;
    }

    if (!media.lastSyncedAt) {
      return true;
    }

    const lastSynced = new Date(media.lastSyncedAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSynced.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays >= thresholdDays;
  }

  /**
   * Update the lastSyncedAt timestamp
   *
   * @param id - Media database ID
   * @param syncDate - Sync timestamp
   * @returns Updated media
   *
   * @example
   * await animeRepo.updateSyncTimestamp(anime.id);
   */
  async updateSyncTimestamp(id: number | bigint, syncDate: Date = new Date()): Promise<T> {
    return this.update({ id }, { lastSyncedAt: syncDate } as unknown as Partial<T>);
  }

  // ============================================
  // MEDIA STATUS QUERIES
  // ============================================

  /**
   * Find media by status
   *
   * @param status - MediaStatus enum value (RELEASING, FINISHED, etc.)
   * @param options - Additional query options
   * @returns Array of media items
   *
   * @example
   * const airingAnime = await animeRepo.findByStatus('RELEASING', {
   *   orderBy: { averageScore: 'desc' },
   *   take: 20
   * });
   */
  async findByStatus(status: string, options: FindOneOptions = {}): Promise<T[]> {
    return this.findMany({
      where: { status },
      ...this._mergeWithDefaultInclude(options),
    });
  }

  /**
   * Find releasing (currently airing) media
   *
   * @param options - Additional query options
   * @returns Array of releasing media
   */
  async findReleasing(options: FindOneOptions = {}): Promise<T[]> {
    return this.findByStatus('RELEASING', options);
  }

  /**
   * Find finished media
   *
   * @param options - Additional query options
   * @returns Array of finished media
   */
  async findFinished(options: FindOneOptions = {}): Promise<T[]> {
    return this.findByStatus('FINISHED', options);
  }

  /**
   * Find upcoming media (not yet released)
   *
   * @param options - Additional query options
   * @returns Array of upcoming media
   */
  async findUpcoming(options: FindOneOptions = {}): Promise<T[]> {
    return this.findByStatus('NOT_YET_RELEASED', options);
  }

  // ============================================
  // SCORING & POPULARITY
  // ============================================

  /**
   * Find top rated media
   *
   * @param options - Query options
   * @returns Array of top rated media
   *
   * @example
   * const topAnime = await animeRepo.findTopRated({ limit: 10, minScore: 8.0 });
   */
  async findTopRated(options: TopRatedOptions = {}): Promise<T[]> {
    const { limit = 20, minScore, ...restOptions } = options;

    const where = minScore ? { averageScore: { gte: minScore } } : {};

    return this.findMany({
      where,
      orderBy: { averageScore: 'desc' },
      take: limit,
      ...this._mergeWithDefaultInclude(restOptions),
    });
  }

  // ============================================
  // ADULT CONTENT FILTERING
  // ============================================

  /**
   * Find media with adult content filter
   *
   * @param includeAdult - Whether to include adult content
   * @param options - Additional query options
   * @returns Array of media items
   */
  async findWithAdultFilter(includeAdult = false, options: FindOneOptions = {}): Promise<T[]> {
    const where = includeAdult ? {} : { isAdult: false };

    return this.findMany({
      where,
      ...this._mergeWithDefaultInclude(options),
    });
  }

  // ============================================
  // METADATA-SPECIFIC OPERATIONS
  // ============================================

  /**
   * Get media with metadata relation by any external ID field
   *
   * Ensures metadata is always included.
   * Use this when you need to guarantee metadata exists.
   *
   * @protected
   * @param fieldName - ID field name
   * @param value - ID value
   * @returns Media with metadata
   *
   * @example
   * // In child class:
   * async getWithMetadata(anilistId: number) {
   *   return this._getWithMetadata('idAnilist', anilistId);
   * }
   */
  protected async _getWithMetadata(fieldName: string, value: number | string): Promise<T | null> {
    return this._findByExternalId(fieldName, value, {
      include: this._getDefaultInclude(),
    });
  }

  // ============================================
  // SEARCH OPERATIONS
  // ============================================

  /**
   * Search media by title (case-insensitive)
   *
   * Searches in romaji, english, and native titles.
   *
   * @param query - Search query
   * @param options - Additional query options
   * @returns Array of matching media
   *
   * @example
   * const results = await animeRepo.searchByTitle('naruto', { limit: 10 });
   */
  async searchByTitle(query: string, options: MediaSearchOptions = {}): Promise<T[]> {
    const { limit = 20, ...restOptions } = options;

    return this.findMany({
      where: {
        OR: [
          { titleRomaji: { contains: query, mode: 'insensitive' } },
          { titleEnglish: { contains: query, mode: 'insensitive' } },
          { titleNative: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { averageScore: 'desc' },
      ...this._mergeWithDefaultInclude(restOptions),
    });
  }
}

export default BaseMediaRepository;
