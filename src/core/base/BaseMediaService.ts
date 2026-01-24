/**
 * Base Media Service
 *
 * Specialized base class for media-related services (Anime, Manga, Novel).
 * This class serves as a foundation for specific media services,
 * implementing the Template Method Pattern for standardized media synchronization workflow.
 *
 * Features:
 * - Data synchronization from external APIs
 * - Cache/sync threshold management with configurable staleness detection
 * - Template methods for standardized media retrieval and batch operations
 * - Automatic fallback to cached data on sync failures
 * - Search and trending functionality
 *
 * Subclasses must implement:
 * - getMediaType() - Return media type string (ANIME, MANGA, NOVEL)
 * - getExternalIdField() - Return external ID field name for the media type
 *
 * @abstract
 * @extends BaseService
 */

import { NotFoundError } from '../../shared/utils/error';
import BaseService from './BaseService';

/**
 * Media type enumeration
 */
export type MediaType = 'ANIME' | 'MANGA' | 'NOVEL';

/**
 * External ID field names
 */
export type ExternalIdField = 'idAnilist' | 'idMal' | 'idAniDb';

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  skip: number;
  take: number;
}

/**
 * Search result with pagination
 */
export interface SearchResult<T> {
  items: T[];
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}

/**
 * Media entity interface (basic structure)
 */
export interface MediaEntity {
  id?: number | bigint;
  lastSyncedAt?: Date | null;
  type?: MediaType;
}

/**
 * Base Media Repository Interface
 */
export interface IMediaRepository {
  findByExternalId(externalId: number): Promise<MediaEntity | null>;
  findManyByExternalIds(externalIds: number[]): Promise<MediaEntity[]>;
  upsertAnime(data: Partial<MediaEntity>): Promise<MediaEntity>;
  searchByTitle(query: string, pagination: PaginationOptions): Promise<MediaEntity[]>;
  countByQuery(filter: { query?: string }): Promise<number>;
}

/**
 * External API Client Interface
 */
export interface IExternalClient {
  fetchById(externalId: number): Promise<unknown>;
}

/**
 * Character Client Interface
 */
export interface ICharacterClient {
  fetchByMediaId(
    mediaId: number,
    mediaType: 'ANIME' | 'MANGA',
    options?: { page?: number; perPage?: number }
  ): Promise<unknown>;
}

/**
 * Staff Client Interface
 */
export interface IStaffClient {
  fetchByMediaId(
    mediaId: number,
    mediaType: 'ANIME' | 'MANGA',
    options?: { page?: number; perPage?: number }
  ): Promise<unknown>;
}

/**
 * Data Adapter Interface
 */
export interface IMediaAdapter {
  fromExternal(externalData: unknown): Partial<MediaEntity>;
  toResponse(dbData: unknown): unknown;
}

/**
 * Base Media Service Abstract Class
 */
export abstract class BaseMediaService extends BaseService {
  protected readonly dbRepository: IMediaRepository;
  protected readonly externalClient: IExternalClient;
  protected readonly adapter: IMediaAdapter;
  protected readonly characterClient?: ICharacterClient;
  protected readonly staffClient?: IStaffClient;
  protected syncThresholdDays: number;
  protected cacheEnabled: boolean;

  /**
   * Create a base media service instance
   *
   * @param dbRepository - Database repository for media storage
   * @param externalClient - External API client (e.g., AnilistClient)
   * @param adapter - Data adapter for transformations
   * @param characterClient - Optional character API client
   * @param staffClient - Optional staff API client
   * @throws {Error} If trying to instantiate abstract class directly
   */
  constructor(
    dbRepository: IMediaRepository,
    externalClient: IExternalClient,
    adapter: IMediaAdapter,
    characterClient?: ICharacterClient,
    staffClient?: IStaffClient
  ) {
    super();

    if (new.target === BaseMediaService) {
      throw new Error('Cannot instantiate abstract class BaseMediaService directly');
    }

    // Dependency Injection
    this.dbRepository = dbRepository;
    this.externalClient = externalClient;
    this.adapter = adapter;
    this.characterClient = characterClient;
    this.staffClient = staffClient;

    // Sync config
    this.syncThresholdDays = 7;
    this.cacheEnabled = true;
  }

  // ============================================
  // ABSTRACT METHODS
  // ============================================

  /**
   * Get media type identifier
   *
   * Must be implemented by subclasses to specify the media type.
   *
   * @returns Media type (ANIME, MANGA, NOVEL)
   * @abstract
   *
   * @example
   * getMediaType() {
   *   return 'ANIME';
   * }
   */
  abstract getMediaType(): MediaType;

  /**
   * Get external ID field name for the media type
   *
   * Must be implemented by subclasses to specify which external ID field to use.
   *
   * @returns Field name (e.g., 'idAnilist', 'idMal')
   * @abstract
   *
   * @example
   * getExternalIdField() {
   *   return 'idAnilist';
   * }
   */
  abstract getExternalIdField(): ExternalIdField;

  // ============================================
  // TEMPLATE METHOD PATTERN
  // ============================================

  /**
   * Get media overview data
   * Includes: relations, characters/staff preview, stats, rankings, recommendations
   *
   * @param externalId - External API ID (e.g., AniList ID)
   * @returns Media overview data
   * @throws {NotFoundError} If media not found or client doesn't support overview
   * @throws {ValidationError} If ID invalid
   *
   * @example
   * const overview = await animeService.getOverview(1);
   */
  async getOverview(externalId: number): Promise<unknown> {
    const context = `getOverview(${externalId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(externalId, `${this.getMediaType()} ID`);

      this._logInfo(`Fetching ${this.getMediaType()} overview`, { externalId });

      // Check if externalClient has fetchOverview method
      if (!('fetchOverview' in this.externalClient)) {
        throw new NotFoundError(`${this.getMediaType()} client does not support overview fetch`);
      }

      const overview = await (this.externalClient as any).fetchOverview(externalId);

      this._logInfo(`Successfully fetched ${this.getMediaType()} overview`, { externalId });

      return overview;
    }, context);
  }

  /**
   * Get characters for media with pagination
   *
   * @param externalId - External API ID
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 25)
   * @returns Characters data with pagination
   * @throws {NotFoundError} If character client not available
   * @throws {ValidationError} If parameters invalid
   *
   * @example
   * const characters = await animeService.getCharacters(1, 1, 25);
   */
  async getCharacters(
    externalId: number,
    page: number = 1,
    perPage: number = 25
  ): Promise<unknown> {
    const context = `getCharacters(${externalId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(externalId, `${this.getMediaType()} ID`);
      this._validateId(page, 'Page number');
      this._validateId(perPage, 'Per page');

      if (!this.characterClient) {
        throw new NotFoundError('Character client not available');
      }

      this._logInfo(`Fetching ${this.getMediaType()} characters`, {
        externalId,
        page,
        perPage,
      });

      const mediaType = this.getMediaType() as 'ANIME' | 'MANGA';
      const characters = await this.characterClient.fetchByMediaId(externalId, mediaType, {
        page,
        perPage,
      });

      this._logInfo(`Successfully fetched ${this.getMediaType()} characters`, {
        externalId,
        page,
      });

      return characters;
    }, context);
  }

  /**
   * Get staff for media with pagination
   *
   * @param externalId - External API ID
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 25)
   * @returns Staff data with pagination
   * @throws {NotFoundError} If staff client not available
   * @throws {ValidationError} If parameters invalid
   *
   * @example
   * const staff = await animeService.getStaff(1, 1, 25);
   */
  async getStaff(externalId: number, page: number = 1, perPage: number = 25): Promise<unknown> {
    const context = `getStaff(${externalId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(externalId, `${this.getMediaType()} ID`);
      this._validateId(page, 'Page number');
      this._validateId(perPage, 'Per page');

      if (!this.staffClient) {
        throw new NotFoundError('Staff client not available');
      }

      this._logInfo(`Fetching ${this.getMediaType()} staff`, {
        externalId,
        page,
        perPage,
      });

      const mediaType = this.getMediaType() as 'ANIME' | 'MANGA';
      const staff = await this.staffClient.fetchByMediaId(externalId, mediaType, {
        page,
        perPage,
      });

      this._logInfo(`Successfully fetched ${this.getMediaType()} staff`, {
        externalId,
        page,
      });

      return staff;
    }, context);
  }

  /**
   * Get statistics for media
   * Includes: rankings, score distribution, status distribution
   *
   * @param externalId - External API ID
   * @returns Media statistics
   * @throws {NotFoundError} If media not found or client doesn't support statistics
   * @throws {ValidationError} If ID invalid
   *
   * @example
   * const stats = await animeService.getStatistics(1);
   */
  async getStatistics(externalId: number): Promise<unknown> {
    const context = `getStatistics(${externalId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(externalId, `${this.getMediaType()} ID`);

      this._logInfo(`Fetching ${this.getMediaType()} statistics`, { externalId });

      // Check if externalClient has fetchStatistics method
      if (!('fetchStatistics' in this.externalClient)) {
        throw new NotFoundError(`${this.getMediaType()} client does not support statistics fetch`);
      }

      const statistics = await (this.externalClient as any).fetchStatistics(externalId);

      this._logInfo(`Successfully fetched ${this.getMediaType()} statistics`, { externalId });

      return statistics;
    }, context);
  }

  /**
   * Get media details by external ID (Template Method)
   *
   * Defines the skeleton of the algorithm to get media details.
   * This method orchestrates the entire workflow:
   * 1. Validates input ID
   * 2. Attempts to retrieve from database
   * 3. Checks if synchronization is needed
   * 4. Syncs from external API if required
   * 5. Formats and returns the response
   *
   * @param externalId - External API ID (e.g., AniList ID)
   * @returns Formatted media data
   * @throws {NotFoundError} If media not found
   * @throws {ValidationError} If ID invalid
   *
   * @example
   * const anime = await animeService.getDetails(1);
   * // Returns formatted anime details
   */
  async getDetails(externalId: number): Promise<unknown> {
    const context = `getDetails(${externalId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(externalId, `${this.getMediaType()} ID`);

      this._logInfo(`Fetching ${this.getMediaType()} details`, { externalId });

      let media = await this._getFromDatabase(externalId);

      if (this._shouldSync(media)) {
        media = await this._syncFromExternal(externalId, media);
      }

      if (!media) {
        throw new NotFoundError(`${this.getMediaType()} with ID ${externalId} not found`);
      }

      const formatted = this.adapter.toResponse(media);

      this._logInfo(`Successfully fetched ${this.getMediaType()}`, {
        externalId,
        wasSynced: this._shouldSync(media),
      });

      return formatted;
    }, context);
  }

  // ============================================
  // SYNC LOGIC METHODS
  // ============================================

  /**
   * Check if media data should be synced from external API
   *
   * Sync is needed when:
   * - Media doesn't exist in database
   * - Media never synced before (lastSyncedAt is null)
   * - Media data is stale (older than syncThresholdDays)
   *
   * @param media - Media data from database
   * @returns True if sync is needed
   *
   * @example
   * if (this._shouldSync(cachedMedia)) {
   *   // Trigger sync
   * }
   */
  protected _shouldSync(media: MediaEntity | null): boolean {
    if (!media) {
      this._logDebug('Sync needed: media not found in database');
      return true;
    }

    if (!media.lastSyncedAt) {
      this._logDebug('Sync needed: media never synced');
      return true;
    }

    const isStale = this._isOlderThan(media.lastSyncedAt, this.syncThresholdDays);

    if (isStale) {
      const daysSinceSync = this._daysBetween(new Date(media.lastSyncedAt), new Date());
      this._logDebug('Sync needed: data is stale', {
        daysSinceSync,
        threshold: this.syncThresholdDays,
      });
    }

    return isStale;
  }

  /**
   * Sync media data from external API and save to database
   *
   * Process:
   * 1. Fetch data from external API
   * 2. Transform to internal format using adapter
   * 3. Add sync metadata (lastSyncedAt, type)
   * 4. Upsert to database
   * 5. Return updated media
   *
   * Fallback Strategy:
   * If sync fails and cached data exists, returns the cached data
   * to ensure service availability even when external API is down.
   *
   * @param externalId - External API ID
   * @param existingMedia - Existing media data (for fallback)
   * @returns Synced media data
   * @throws If sync fails and no cached data available
   *
   * @example
   * const synced = await this._syncFromExternal(123, cachedData);
   */
  protected async _syncFromExternal(
    externalId: number,
    existingMedia: MediaEntity | null = null
  ): Promise<MediaEntity | null> {
    try {
      this._logInfo(`Syncing ${this.getMediaType()} from external API`, { externalId });

      const externalData = await this._fetchFromExternalAPI(externalId);

      if (!externalData) {
        throw new NotFoundError(
          `${this.getMediaType()} with ID ${externalId} not found on external API`
        );
      }

      const transformedData = this.adapter.fromExternal(externalData);

      transformedData.lastSyncedAt = new Date();
      transformedData.type = this.getMediaType();

      const syncedMedia = await this.dbRepository.upsertAnime(transformedData);

      this._logInfo(`Successfully synced ${this.getMediaType()}`, {
        externalId,
        mediaId: syncedMedia.id,
      });

      return syncedMedia;
    } catch (error) {
      if (existingMedia) {
        this._logWarn(`Sync failed for ${this.getMediaType()}, using cached data`, {
          externalId,
          error: (error as Error).message,
          cacheAge: existingMedia.lastSyncedAt
            ? this._daysBetween(new Date(existingMedia.lastSyncedAt), new Date())
            : 'unknown',
        });
        return existingMedia;
      }

      this._logError(`Sync failed for ${this.getMediaType()} and no cache available`, {
        externalId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Fetch data from external API
   *
   * Delegates to appropriate external client method based on media type.
   * Can be overridden by subclasses for custom fetch logic.
   *
   * @param externalId - External API ID
   * @returns External API response
   *
   * @example
   * const rawData = await this._fetchFromExternalAPI(123);
   */
  protected async _fetchFromExternalAPI(externalId: number): Promise<unknown> {
    return this.externalClient.fetchById(externalId);
  }

  /**
   * Get media from database by external ID
   *
   * Uses repository's findById method to retrieve media.
   * Logs the result for debugging purposes.
   *
   * @param externalId - External API ID
   * @returns Media from database or null if not found
   *
   * @example
   * const cached = await this._getFromDatabase(123);
   */
  protected async _getFromDatabase(externalId: number): Promise<MediaEntity | null> {
    try {
      const media = await this.dbRepository.findByExternalId(externalId);

      if (media) {
        this._logDebug(`Found ${this.getMediaType()} in database`, { externalId });
      } else {
        this._logDebug(`${this.getMediaType()} not found in database`, { externalId });
      }

      return media;
    } catch (error) {
      this._logError(`Error fetching ${this.getMediaType()} from database`, {
        externalId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // ============================================
  // SEARCH & LIST METHODS
  // ============================================

  /**
   * Search media by query string
   *
   * Template method for search operations.
   * Searches in local database and returns paginated results.
   *
   * @param query - Search query string
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 20)
   * @returns Search results with pagination metadata
   * @throws {ValidationError} If query is invalid
   *
   * @example
   * const results = await service.search('naruto', 1, 20);
   * // Returns: { items: [...], pagination: {...} }
   */
  async search(
    query: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<SearchResult<unknown>> {
    const context = `search("${query}")`;

    return this._executeWithErrorHandling(async () => {
      // Validate query
      this._validateString(query, 'Search query', { minLength: 1, maxLength: 100 });

      // Get pagination params
      const pagination = this._getPaginationParams(page, perPage);

      this._logInfo(`Searching ${this.getMediaType()}`, { query, page, perPage });

      const results = await this.dbRepository.searchByTitle(query, {
        skip: pagination.skip,
        take: pagination.take,
      });

      const formattedResults = results.map((item) => this.adapter.toResponse(item));

      const total = await this.dbRepository.countByQuery({ query });
      return {
        items: formattedResults,
        pagination: this._buildPaginationMeta(page, perPage, total),
      };
    }, context);
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Get multiple media items by IDs
   *
   * Efficiently fetches and syncs multiple media items.
   * Process:
   * 1. Fetch all from database
   * 2. Identify items that need sync
   * 3. Sync stale items in parallel
   * 4. Re-fetch updated items
   * 5. Format and return
   *
   * @param externalIds - Array of external IDs
   * @returns Array of formatted media items
   *
   * @example
   * const media = await service.getMany([1, 2, 3, 4, 5]);
   */
  async getMany(externalIds: number[]): Promise<unknown[]> {
    const context = 'getMany()';

    return this._executeWithErrorHandling(async () => {
      this._logInfo(`Fetching multiple ${this.getMediaType()}`, {
        count: externalIds.length,
      });

      const mediaItems = await this.dbRepository.findManyByExternalIds(externalIds);
      const needSync = mediaItems.filter((m) => this._shouldSync(m));

      if (needSync.length > 0) {
        this._logInfo(`Syncing ${needSync.length} ${this.getMediaType()} items`);

        await Promise.all(
          needSync.map((m) => {
            const externalId = m[this.getExternalIdField() as keyof MediaEntity] as number;
            return this._syncFromExternal(externalId, m);
          })
        );
      }

      const updatedItems = await this.dbRepository.findManyByExternalIds(externalIds);

      return updatedItems.map((item) => this.adapter.toResponse(item));
    }, context);
  }

  // ============================================
  // CONFIGURATION METHODS
  // ============================================

  /**
   * Set sync threshold in days
   *
   * Configures how long cached data is considered fresh before re-syncing.
   *
   * @param days - Number of days before re-sync is needed
   * @throws {ValidationError} If days is not a positive integer
   *
   * @example
   * service.setSyncThreshold(14); // Cache for 14 days
   */
  setSyncThreshold(days: number): void {
    this._validateId(days, 'Sync threshold days');
    this.syncThresholdDays = days;
    this._logInfo(`Sync threshold updated to ${days} days`);
  }

  /**
   * Enable or disable caching
   *
   * @param enabled - Cache enabled flag
   *
   * @example
   * service.setCacheEnabled(false); // Disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    this._logInfo(`Cache ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current sync threshold
   *
   * @returns Current sync threshold in days
   */
  getSyncThreshold(): number {
    return this.syncThresholdDays;
  }

  /**
   * Check if caching is enabled
   *
   * @returns True if caching is enabled
   */
  isCacheEnabled(): boolean {
    return this.cacheEnabled;
  }
}

export default BaseMediaService;
