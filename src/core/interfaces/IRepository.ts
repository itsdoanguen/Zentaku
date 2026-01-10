/**
 * Base Repository Interface
 *
 * Defines the contract for all repository implementations.
 * Provides standard CRUD operations and common query methods.
 *
 * @template T - The entity/model type managed by this repository
 */

import type { Prisma } from '@prisma/client';

/**
 * Options for finding a single record
 */
export interface FindOptions {
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean>;
}

/**
 * Options for finding multiple records
 */
export interface FindManyOptions extends FindOptions {
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[];
  skip?: number;
  take?: number;
}

/**
 * Options for counting records
 */
export interface CountOptions {
  where?: Record<string, any>;
}

/**
 * Transaction client type
 */
export type TransactionClient = Prisma.TransactionClient;

/**
 * Base Repository Interface
 * All repositories must implement these methods
 */
export interface IRepository<T> {
  /**
   * Find a single record by ID
   * @param id - The record ID
   * @param options - Query options (include, select)
   * @returns The found record or null
   */
  findById(id: number | bigint, options?: FindOptions): Promise<T | null>;

  /**
   * Find a single record by custom criteria
   * @param where - Where clause
   * @param options - Query options
   * @returns The found record or null
   */
  findOne(where: Record<string, any>, options?: FindOptions): Promise<T | null>;

  /**
   * Find multiple records
   * @param options - Query options (where, orderBy, pagination)
   * @returns Array of records
   */
  findMany(options?: FindManyOptions): Promise<T[]>;

  /**
   * Find all records (use with caution)
   * @param options - Query options
   * @returns Array of all records
   */
  findAll(options?: FindOptions): Promise<T[]>;

  /**
   * Create a new record
   * @param data - The data to create
   * @returns The created record
   */
  create(data: any): Promise<T>;

  /**
   * Update a record by ID
   * @param id - The record ID
   * @param data - The data to update
   * @returns The updated record
   */
  update(id: number | bigint, data: any): Promise<T>;

  /**
   * Delete a record by ID
   * @param id - The record ID
   * @returns The deleted record
   */
  delete(id: number | bigint): Promise<T>;

  /**
   * Count records matching criteria
   * @param options - Count options
   * @returns The count
   */
  count(options?: CountOptions): Promise<number>;

  /**
   * Check if a record exists
   * @param where - Where clause
   * @returns True if exists
   */
  exists(where: Record<string, any>): Promise<boolean>;

  /**
   * Execute operations within a transaction
   * @param callback - Transaction callback
   * @returns Result of the transaction
   */
  transaction<R>(callback: (tx: TransactionClient) => Promise<R>): Promise<R>;
}

/**
 * Repository with pagination support
 */
export interface IPaginatedRepository<T> extends IRepository<T> {
  /**
   * Find records with pagination
   * @param page - Page number (1-based)
   * @param limit - Records per page
   * @param options - Additional query options
   * @returns Paginated result
   */
  findPaginated(
    page: number,
    limit: number,
    options?: FindManyOptions
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}

/**
 * Repository with soft delete support
 */
export interface ISoftDeleteRepository<T> extends IRepository<T> {
  /**
   * Soft delete a record (mark as deleted)
   * @param id - The record ID
   * @returns The soft-deleted record
   */
  softDelete(id: number | bigint): Promise<T>;

  /**
   * Restore a soft-deleted record
   * @param id - The record ID
   * @returns The restored record
   */
  restore(id: number | bigint): Promise<T>;

  /**
   * Find records including soft-deleted ones
   * @param options - Query options
   * @returns Array of records
   */
  findWithDeleted(options?: FindManyOptions): Promise<T[]>;
}
