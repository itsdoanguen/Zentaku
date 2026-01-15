/**
 * Base Repository
 *
 * Provides common Prisma CRUD operations for all repositories.
 * This class serves as a foundation for specific repositories,
 * eliminating code duplication and ensuring consistent data access patterns.
 *
 * Features:
 * - Standard CRUD operations (Create, Read, Update, Delete)
 * - Pagination support
 * - Transaction support
 * - Existence checks
 * - Raw query escape hatch
 *
 * @abstract
 * @template T - Prisma model type
 * @template ModelName - Prisma model name
 */

import type { PrismaClient } from '@prisma/client';

/**
 * Options for finding a single record
 */
export interface FindOneOptions {
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean>;
}

/**
 * Options for finding multiple records
 */
export interface FindManyOptions<T = unknown> extends FindOneOptions {
  where?: Partial<T> | Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
  skip?: number;
  take?: number;
}

/**
 * Batch operation result
 */
export interface BatchResult {
  count: number;
}

/**
 * Pagination options
 */
export interface PaginationOptions<T = unknown> extends Omit<FindManyOptions<T>, 'skip' | 'take'> {
  page?: number;
  perPage?: number;
  where?: Partial<T> | Record<string, unknown>;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Base Repository Abstract Class
 */
export abstract class BaseRepository<T = unknown, ModelName extends string = string> {
  protected readonly prisma: PrismaClient;
  protected readonly model: unknown;
  protected readonly modelName: ModelName;

  /**
   * Create a base repository instance
   *
   * @param prisma - Prisma client instance
   * @param modelName - Name of Prisma model (e.g., 'mediaItem', 'user')
   * @throws {Error} If trying to instantiate abstract class directly
   * @throws {Error} If prisma client is not provided
   * @throws {Error} If model name is invalid
   */
  constructor(prisma: PrismaClient, modelName: ModelName) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository is abstract and cannot be instantiated directly');
    }

    if (!prisma) {
      throw new Error('Prisma client is required');
    }

    if (!modelName || !(prisma as unknown as Record<string, unknown>)[modelName]) {
      throw new Error(`Invalid model name: ${modelName}. Model does not exist in Prisma schema.`);
    }

    this.prisma = prisma;
    this.model = (prisma as unknown as Record<string, unknown>)[modelName];
    this.modelName = modelName;
  }

  // ============================================
  // BASIC READ OPERATIONS
  // ============================================

  /**
   * Find a single record by database ID
   *
   * @param id - Record database ID
   * @param options - Query options
   * @returns Found record or null if not found
   *
   * @example
   * const user = await userRepo.findById(1, { include: { profile: true } });
   */
  async findById(id: number | bigint, options: FindOneOptions = {}): Promise<T | null> {
    return (this.model as any).findUnique({
      where: { id },
      ...options,
    });
  }

  /**
   * Find a single record by arbitrary where clause
   *
   * @param where - Where conditions
   * @param options - Query options
   * @returns Found record or null
   *
   * @example
   * const user = await userRepo.findOne({ email: 'user@example.com' });
   */
  async findOne(where: Record<string, unknown>, options: FindOneOptions = {}): Promise<T | null> {
    return (this.model as any).findUnique({
      where,
      ...options,
    });
  }

  /**
   * Find first record matching criteria
   * Similar to findOne but uses findFirst (less strict)
   *
   * @param options - Query options
   * @returns Found record or null
   *
   * @example
   * const latestPost = await postRepo.findFirst({
   *   where: { published: true },
   *   orderBy: { createdAt: 'desc' }
   * });
   */
  async findFirst(options: FindManyOptions = {}): Promise<T | null> {
    return (this.model as any).findFirst(options);
  }

  /**
   * Find multiple records
   *
   * @param options - Query options
   * @returns Array of records
   *
   * @example
   * const posts = await postRepo.findMany({
   *   where: { authorId: 1 },
   *   orderBy: { createdAt: 'desc' },
   *   take: 10
   * });
   */
  async findMany(options: FindManyOptions = {}): Promise<T[]> {
    return (this.model as any).findMany(options);
  }

  /**
   * Find all records (use with caution on large tables)
   *
   * @param options - Query options
   * @returns Array of all records
   */
  async findAll(options: FindOneOptions = {}): Promise<T[]> {
    return (this.model as any).findMany(options);
  }

  /**
   * Count records matching criteria
   *
   * @param where - Where conditions
   * @returns Count of matching records
   *
   * @example
   * const publishedCount = await postRepo.count({ published: true });
   */
  async count(where: Record<string, unknown> = {}): Promise<number> {
    return (this.model as any).count({ where });
  }

  /**
   * Check if record exists
   *
   * @param where - Where conditions
   * @returns True if exists, false otherwise
   *
   * @example
   * const emailExists = await userRepo.exists({ email: 'test@example.com' });
   */
  async exists(where: Record<string, unknown>): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  /**
   * Create a new record
   *
   * @param data - Data to create
   * @param options - Additional options
   * @returns Created record
   *
   * @example
   * const user = await userRepo.create({
   *   email: 'user@example.com',
   *   name: 'John Doe'
   * });
   */
  async create(data: Partial<T>, options: FindOneOptions = {}): Promise<T> {
    return (this.model as any).create({
      data,
      ...options,
    });
  }

  /**
   * Create multiple records
   *
   * @param data - Array of data to create
   * @param options - Additional options
   * @returns Object with count of created records
   *
   * @example
   * const result = await userRepo.createMany([
   *   { email: 'user1@example.com', name: 'User 1' },
   *   { email: 'user2@example.com', name: 'User 2' }
   * ]);
   */
  async createMany(
    data: Partial<T>[],
    options: { skipDuplicates?: boolean } = {}
  ): Promise<BatchResult> {
    return (this.model as any).createMany({
      data,
      ...options,
    });
  }

  // ============================================
  // UPDATE OPERATIONS
  // ============================================

  /**
   * Update a single record
   *
   * @param where - Where conditions to find record
   * @param data - Data to update
   * @param options - Additional options
   * @returns Updated record
   * @throws {Error} If record not found
   *
   * @example
   * const user = await userRepo.update(
   *   { id: 1 },
   *   { name: 'Updated Name' }
   * );
   */
  async update(
    where: Record<string, unknown>,
    data: Partial<T>,
    options: FindOneOptions = {}
  ): Promise<T> {
    return (this.model as any).update({
      where,
      data,
      ...options,
    });
  }

  /**
   * Update multiple records
   *
   * @param where - Where conditions
   * @param data - Data to update
   * @returns Object with count of updated records
   *
   * @example
   * const result = await postRepo.updateMany(
   *   { authorId: 1 },
   *   { published: true }
   * );
   */
  async updateMany(where: Record<string, unknown>, data: Partial<T>): Promise<BatchResult> {
    return (this.model as any).updateMany({
      where,
      data,
    });
  }

  // ============================================
  // UPSERT OPERATIONS
  // ============================================

  /**
   * Upsert a record (create if doesn't exist, update if exists)
   *
   * @param where - Where conditions for finding existing record
   * @param create - Data for creating new record
   * @param update - Data for updating existing record
   * @param options - Additional options
   * @returns Created or updated record
   *
   * @example
   * const user = await userRepo.upsert(
   *   { email: 'user@example.com' },
   *   { email: 'user@example.com', name: 'New User' },
   *   { name: 'Updated User' }
   * );
   */
  async upsert(
    where: Record<string, unknown>,
    create: Partial<T>,
    update: Partial<T>,
    options: FindOneOptions = {}
  ): Promise<T> {
    const { include, select } = options;

    return (this.model as any).upsert({
      where,
      create,
      update,
      ...(include && { include }),
      ...(select && { select }),
    });
  }

  // ============================================
  // DELETE OPERATIONS
  // ============================================

  /**
   * Delete a single record
   *
   * @param where - Where conditions
   * @returns Deleted record
   * @throws {Error} If record not found
   *
   * @example
   * const deletedUser = await userRepo.delete({ id: 1 });
   */
  async delete(where: Record<string, unknown>): Promise<T> {
    return (this.model as any).delete({ where });
  }

  /**
   * Delete multiple records
   *
   * @param where - Where conditions
   * @returns Object with count of deleted records
   *
   * @example
   * const result = await postRepo.deleteMany({ published: false });
   */
  async deleteMany(where: Record<string, unknown>): Promise<BatchResult> {
    return (this.model as any).deleteMany({ where });
  }

  // ============================================
  // PAGINATION SUPPORT
  // ============================================

  /**
   * Find records with pagination
   *
   * Returns paginated results with metadata
   *
   * @param options - Query options with pagination
   * @returns Pagination result
   *
   * @example
   * const result = await postRepo.findPaginated({
   *   page: 2,
   *   perPage: 10,
   *   where: { published: true },
   *   orderBy: { createdAt: 'desc' }
   * });
   * // result = { data: [...], total: 50, page: 2, perPage: 10, totalPages: 5, ... }
   */
  async findPaginated({
    page = 1,
    perPage = 20,
    where = {},
    ...options
  }: PaginationOptions): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      (this.model as any).findMany({
        where,
        skip,
        take: perPage,
        ...options,
      }),
      this.count(where),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return {
      data,
      total,
      page,
      perPage,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  // ============================================
  // RAW QUERIES (Escape Hatch)
  // ============================================

  /**
   * Execute raw SQL query
   *
   * Use this as an escape hatch when Prisma's query builder is insufficient.
   * Be careful with SQL injection - use parameterized queries.
   *
   * @param query - SQL query template
   * @param params - Query parameters
   * @returns Query result
   *
   * @example
   * const result = await repo.rawQuery`
   *   SELECT * FROM users WHERE email = ${email}
   * `;
   */
  async rawQuery<R = unknown>(query: TemplateStringsArray, ...params: unknown[]): Promise<R> {
    return this.prisma.$queryRaw(query as never, ...params) as Promise<R>;
  }

  /**
   * Execute raw SQL with unsafe string interpolation
   *
   * @param query - SQL query string
   * @returns Query result
   */
  async rawQueryUnsafe<R = unknown>(query: string): Promise<R> {
    return this.prisma.$queryRawUnsafe(query) as Promise<R>;
  }

  /**
   * Execute raw SQL write operation
   *
   * @param query - SQL query template
   * @param params - Query parameters
   * @returns Number of affected rows
   */
  async executeRaw(query: TemplateStringsArray, ...params: unknown[]): Promise<number> {
    return this.prisma.$executeRaw(query as never, ...params);
  }

  // ============================================
  // DIRECT ACCESS
  // ============================================

  /**
   * Get Prisma client instance
   *
   * Use this when you need direct access to Prisma client
   * for operations not covered by base repository methods.
   *
   * @returns Prisma client instance
   *
   * @example
   * const prisma = repo.getPrismaClient();
   * const result = await prisma.user.findMany({
   *   where: { conditions },
   *   include: { relations }
   * });
   */
  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Get Prisma model delegate
   *
   * Use this for direct access to the model's methods.
   *
   * @returns Prisma model delegate
   *
   * @example
   * const model = repo.getModel();
   * const result = await model.aggregate({
   *   _avg: { score: true },
   *   _count: true
   * });
   */
  getModel(): unknown {
    return this.model;
  }

  /**
   * Get model name
   *
   * @returns Model name
   */
  getModelName(): ModelName {
    return this.modelName;
  }
}

export default BaseRepository;
