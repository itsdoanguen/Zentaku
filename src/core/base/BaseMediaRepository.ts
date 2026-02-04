/**
 * Base Media Repository
 *
 * Specialized repository for MediaItem entities with inheritance pattern.
 * Handles common operations for anime, manga, and novel repositories.
 *
 * @extends BaseRepository
 */

import type { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { BaseRepository, type FindManyOptions, type FindOneOptions } from './BaseRepository';

export interface MediaSearchOptions extends Omit<FindManyOptions, 'where'> {
  limit?: number;
}

export interface TopRatedOptions extends MediaSearchOptions {
  minScore?: number;
}

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
   * @protected
   */
  protected _getDefaultRelations(): string[] {
    return [];
  }

  /**
   * Merge user-provided options with default relations
   * @protected
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
   * @protected
   * @param fieldName - Name of the ID field (e.g., 'idAnilist', 'idMal', 'idMangadex')
   * @param value - ID value
   * @param options - Additional query options
   * @returns Media item or null if not found
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
   * @protected
   * @param fieldName - Name of the ID field (e.g., 'idAnilist', 'idMal')
   * @param values - Array of ID values
   * @param options - Additional query options
   * @returns Array of media items
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
   * Should sync when: Media not exist, lastSyncedAt missing, or lastSyncedAt too old
   *
   * @param media - Media object from database
   * @param thresholdDays - Number of days before re-sync
   * @returns Boolean indicating
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

  //Find releasing (currently airing) media
  async findReleasing(options: FindOneOptions = {}): Promise<T[]> {
    return this.findByStatus('RELEASING', options);
  }

  //Find finished media
  async findFinished(options: FindOneOptions = {}): Promise<T[]> {
    return this.findByStatus('FINISHED', options);
  }

  //Find upcoming media (not yet released)
  async findUpcoming(options: FindOneOptions = {}): Promise<T[]> {
    return this.findByStatus('NOT_YET_RELEASED', options);
  }

  // ============================================
  // SCORING & POPULARITY
  // ============================================

  //Find top rated media
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
