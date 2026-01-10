/**
 * Base Service Interface
 *
 * Defines the contract for service layer components.
 * Services contain business logic and orchestrate repository operations.
 */

/**
 * Validation options for string validation
 */
export interface ValidationOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowEmpty?: boolean;
}

/**
 * Service error types
 */
export enum ServiceErrorType {
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL = 'INTERNAL',
}

/**
 * Base service interface
 * All services should follow these patterns
 */
export interface IService {
  /**
   * Service name for logging and identification
   */
  readonly serviceName?: string;
}

/**
 * CRUD Service Interface
 * Services that provide standard CRUD operations
 */
export interface ICRUDService<T, CreateDTO, UpdateDTO> extends IService {
  /**
   * Get entity by ID
   * @param id - Entity ID
   * @returns The entity or null
   */
  getById(id: number): Promise<T | null>;

  /**
   * Get all entities
   * @param filters - Optional filters
   * @returns Array of entities
   */
  getAll(filters?: Record<string, any>): Promise<T[]>;

  /**
   * Create new entity
   * @param data - Creation data
   * @returns Created entity
   */
  create(data: CreateDTO): Promise<T>;

  /**
   * Update entity
   * @param id - Entity ID
   * @param data - Update data
   * @returns Updated entity
   */
  update(id: number, data: UpdateDTO): Promise<T>;

  /**
   * Delete entity
   * @param id - Entity ID
   * @returns Deleted entity
   */
  delete(id: number): Promise<T>;
}

/**
 * Media Service Interface
 * For services handling media (Anime, Manga, Novel)
 */
export interface IMediaService<T> extends IService {
  /**
   * Get media details by external API ID
   * @param externalId - External API ID (e.g., AniList ID)
   * @returns Media details
   */
  getDetails(externalId: number): Promise<T>;

  /**
   * Search media
   * @param query - Search query
   * @param filters - Search filters
   * @returns Search results
   */
  search(query: string, filters?: Record<string, any>): Promise<{ data: T[]; total: number }>;

  /**
   * Sync media from external API
   * @param externalId - External API ID
   * @returns Synced media
   */
  syncFromExternal(externalId: number): Promise<T>;

  /**
   * Get trending media
   * @param limit - Number of results
   * @returns Trending media
   */
  getTrending(limit?: number): Promise<T[]>;

  /**
   * Get popular media
   * @param limit - Number of results
   * @returns Popular media
   */
  getPopular(limit?: number): Promise<T[]>;
}

/**
 * External Data Source Interface
 * For services that fetch from external APIs
 */
export interface IExternalDataService<ExternalData, InternalData> extends IService {
  /**
   * Fetch data from external API
   * @param id - External ID
   * @returns External data
   */
  fetchExternal(id: number): Promise<ExternalData>;

  /**
   * Transform external data to internal format
   * @param externalData - External API data
   * @returns Internal data format
   */
  transformToInternal(externalData: ExternalData): InternalData;

  /**
   * Check if data should be synced
   * @param lastSyncedAt - Last sync timestamp
   * @returns True if sync needed
   */
  shouldSync(lastSyncedAt: Date | null): boolean;
}

/**
 * Cache-aware Service Interface
 */
export interface ICacheableService<T> extends IService {
  /**
   * Get from cache or fetch
   * @param key - Cache key
   * @param fetcher - Fetcher function if cache miss
   * @returns Cached or fetched data
   */
  getOrFetch(key: string, fetcher: () => Promise<T>): Promise<T>;

  /**
   * Invalidate cache
   * @param key - Cache key or pattern
   */
  invalidateCache(key: string): Promise<void>;

  /**
   * Clear all cache
   */
  clearCache(): Promise<void>;
}
