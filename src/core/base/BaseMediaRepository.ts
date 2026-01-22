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

import type { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
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
export abstract class BaseMediaRepository<
  T extends ObjectLiteral = ObjectLiteral,
> extends BaseRepository<T> {
  /**
   * Create a media repository instance
   *
   * @param repository - TypeORM repository instance
   */
  constructor(repository: Repository<T>) {
    super(repository);
  }

  // ============================================
  // PROTECTED HELPERS
  // ============================================

  /**
   * Get default relations for media queries
   *
   * Returns empty array since entities are now flat (no separate metadata tables).
   * Override this method in child classes if relations are needed.
   *
   * @protected
   * @returns Relations array for TypeORM queries
   */
  protected _getDefaultRelations(): string[] {
    return [];
  }

  /**
   * Merge user-provided options with default relations
   *
   * @protected
   * @param options - User-provided options
   * @returns Merged options
   */
  protected _mergeWithDefaultRelations(options: FindOneOptions = {}): FindOneOptions {
    if (options.relations) {
      return options;
    }

    return {
      ...options,
      relations: this._getDefaultRelations(),
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
    const mergedOptions = this._mergeWithDefaultRelations(options);
    return this.findOne({
      where: { [fieldName]: value } as unknown as FindOptionsWhere<T>,
      relations: mergedOptions.relations,
      select: mergedOptions.select as any,
      order: mergedOptions.order,
    });
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

    const repository = this.getRepository();
    const mergedOptions = this._mergeWithDefaultRelations(options);

    return repository.find({
      where: { [fieldName]: values } as any,
      relations: mergedOptions.relations,
      select: mergedOptions.select as any,
      order: mergedOptions.order,
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
    if (!media) {
      return true;
    }

    if (typeof media !== 'object') {
      return true;
    }

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
  async updateSyncTimestamp(id: number | bigint, syncDate: Date = new Date()): Promise<T | null> {
    return this.update(id, { lastSyncedAt: syncDate } as any);
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
   *   order: { averageScore: 'DESC' },
   *   take: 20
   * });
   */
  async findByStatus(status: string, options: FindOneOptions = {}): Promise<T[]> {
    const repository = this.getRepository();
    const mergedOptions = this._mergeWithDefaultRelations(options);

    return repository.find({
      where: { status } as any,
      relations: mergedOptions.relations,
      select: mergedOptions.select as any,
      order: mergedOptions.order,
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
    const repository = this.getRepository();

    const queryBuilder = repository.createQueryBuilder('media');

    if (minScore !== undefined) {
      queryBuilder.where('media.averageScore >= :minScore', { minScore });
    }

    queryBuilder.orderBy('media.averageScore', 'DESC').take(limit);

    const relations = this._mergeWithDefaultRelations(restOptions).relations;
    if (relations) {
      Object.keys(relations).forEach((relation) => {
        queryBuilder.leftJoinAndSelect(`media.${relation}`, relation);
      });
    }

    return queryBuilder.getMany();
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
    const repository = this.getRepository();
    const mergedOptions = this._mergeWithDefaultRelations(options);

    const where: any = includeAdult ? {} : { isAdult: false };

    return repository.find({
      where,
      relations: mergedOptions.relations,
      select: mergedOptions.select as any,
      order: mergedOptions.order,
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
      relations: this._getDefaultRelations(),
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
    const repository = this.getRepository();

    const queryBuilder = repository.createQueryBuilder('media');

    queryBuilder
      .where('LOWER(media.titleRomaji) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(media.titleEnglish) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(media.titleNative) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('media.averageScore', 'DESC')
      .take(limit);

    const relations = this._mergeWithDefaultRelations(restOptions).relations;
    if (relations) {
      Object.keys(relations).forEach((relation) => {
        queryBuilder.leftJoinAndSelect(`media.${relation}`, relation);
      });
    }

    return queryBuilder.getMany();
  }
}

export default BaseMediaRepository;
