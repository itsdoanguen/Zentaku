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
 */
class BaseRepository {
  /**
   * Create a base repository instance
   * 
   * @param {Object} prisma - Prisma client instance
   * @param {string} modelName - Name of Prisma model (e.g., 'mediaItem', 'user')
   * @throws {Error} If trying to instantiate abstract class directly
   * @throws {Error} If prisma client is not provided
   * @throws {Error} If model name is invalid
   */
  constructor(prisma, modelName) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository is abstract and cannot be instantiated directly');
    }

    if (!prisma) {
      throw new Error('Prisma client is required');
    }

    if (!modelName || !prisma[modelName]) {
      throw new Error(`Invalid model name: ${modelName}. Model does not exist in Prisma schema.`);
    }

    /**
     * Prisma client instance
     * @protected
     * @type {Object}
     */
    this.prisma = prisma;

    /**
     * Prisma model delegate
     * @protected
     * @type {Object}
     */
    this.model = prisma[modelName];

    /**
     * Model name for debugging
     * @protected
     * @type {string}
     */
    this.modelName = modelName;
  }

  // ============================================
  // BASIC READ OPERATIONS
  // ============================================

  /**
   * Find a single record by database ID
   * 
   * @param {number|bigint} id - Record database ID
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.include] - Relations to include
   * @param {Object} [options.select] - Fields to select
   * @returns {Promise<T|null>} Found record or null if not found
   * 
   * @example
   * const user = await userRepo.findById(1, { include: { profile: true } });
   */
  async findById(id, options = {}) {
    return this.model.findUnique({
      where: { id },
      ...options
    });
  }

  /**
   * Find a single record by arbitrary where clause
   * 
   * @param {Object} where - Where conditions
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.include] - Relations to include
   * @param {Object} [options.select] - Fields to select
   * @returns {Promise<T|null>} Found record or null
   * 
   * @example
   * const user = await userRepo.findOne({ email: 'user@example.com' });
   */
  async findOne(where, options = {}) {
    return this.model.findUnique({
      where,
      ...options
    });
  }

  /**
   * Find first record matching criteria
   * Similar to findOne but uses findFirst (less strict)
   * 
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.where] - Where conditions
   * @param {Object} [options.include] - Relations to include
   * @param {Object} [options.orderBy] - Order by clause
   * @returns {Promise<T|null>}
   * 
   * @example
   * const latestPost = await postRepo.findFirst({ 
   *   where: { published: true },
   *   orderBy: { createdAt: 'desc' }
   * });
   */
  async findFirst(options = {}) {
    return this.model.findFirst(options);
  }

  /**
   * Find multiple records
   * 
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.where] - Where conditions
   * @param {Object} [options.include] - Relations to include
   * @param {Object} [options.select] - Fields to select
   * @param {Object} [options.orderBy] - Order by clause
   * @param {number} [options.skip] - Number of records to skip (pagination)
   * @param {number} [options.take] - Number of records to take (limit)
   * @returns {Promise<T[]>} Array of records
   * 
   * @example
   * const posts = await postRepo.findMany({
   *   where: { authorId: 1 },
   *   orderBy: { createdAt: 'desc' },
   *   take: 10
   * });
   */
  async findMany(options = {}) {
    return this.model.findMany(options);
  }

  /**
   * Find all records (use with caution on large tables)
   * 
   * @param {Object} [options={}] - Query options
   * @returns {Promise<T[]>}
   */
  async findAll(options = {}) {
    return this.model.findMany(options);
  }

  /**
   * Count records matching criteria
   * 
   * @param {Object} [where={}] - Where conditions
   * @returns {Promise<number>} Count of matching records
   * 
   * @example
   * const publishedCount = await postRepo.count({ published: true });
   */
  async count(where = {}) {
    return this.model.count({ where });
  }

  /**
   * Check if record exists
   * 
   * @param {Object} where - Where conditions
   * @returns {Promise<boolean>} True if exists, false otherwise
   * 
   * @example
   * const emailExists = await userRepo.exists({ email: 'test@example.com' });
   */
  async exists(where) {
    const count = await this.count(where);
    return count > 0;
  }

  // ============================================
  // CREATE OPERATIONS
  // ============================================

  /**
   * Create a new record
   * 
   * @param {Object} data - Data to create
   * @param {Object} [options={}] - Additional options
   * @param {Object} [options.include] - Relations to include in return
   * @param {Object} [options.select] - Fields to select in return
   * @returns {Promise<T>} Created record
   * 
   * @example
   * const user = await userRepo.create({
   *   email: 'user@example.com',
   *   name: 'John Doe'
   * });
   */
  async create(data, options = {}) {
    return this.model.create({
      data,
      ...options
    });
  }

  /**
   * Create multiple records
   * 
   * @param {Object[]} data - Array of data to create
   * @param {Object} [options={}] - Additional options
   * @returns {Promise<{count: number}>} Object with count of created records
   * 
   * @example
   * const result = await userRepo.createMany([
   *   { email: 'user1@example.com', name: 'User 1' },
   *   { email: 'user2@example.com', name: 'User 2' }
   * ]);
   */
  async createMany(data, options = {}) {
    return this.model.createMany({
      data,
      ...options
    });
  }

  // ============================================
  // UPDATE OPERATIONS
  // ============================================

  /**
   * Update a single record
   * 
   * @param {Object} where - Where conditions to find record
   * @param {Object} data - Data to update
   * @param {Object} [options={}] - Additional options
   * @param {Object} [options.include] - Relations to include in return
   * @param {Object} [options.select] - Fields to select in return
   * @returns {Promise<T>} Updated record
   * @throws {Error} If record not found
   * 
   * @example
   * const user = await userRepo.update(
   *   { id: 1 },
   *   { name: 'Updated Name' }
   * );
   */
  async update(where, data, options = {}) {
    return this.model.update({
      where,
      data,
      ...options
    });
  }

  /**
   * Update multiple records
   * 
   * @param {Object} where - Where conditions
   * @param {Object} data - Data to update
   * @returns {Promise<{count: number}>} Object with count of updated records
   * 
   * @example
   * const result = await postRepo.updateMany(
   *   { authorId: 1 },
   *   { published: true }
   * );
   */
  async updateMany(where, data) {
    return this.model.updateMany({
      where,
      data
    });
  }

  // ============================================
  // UPSERT OPERATIONS
  // ============================================

  /**
   * Upsert a record (create if doesn't exist, update if exists)
   * 
   * @param {Object} where - Where conditions for finding existing record
   * @param {Object} create - Data for creating new record
   * @param {Object} update - Data for updating existing record
   * @param {Object} [options={}] - Additional options
   * @param {Object} [options.include] - Relations to include in return
   * @param {Object} [options.select] - Fields to select in return
   * @returns {Promise<T>} Created or updated record
   * 
   * @example
   * const user = await userRepo.upsert(
   *   { email: 'user@example.com' },
   *   { email: 'user@example.com', name: 'New User' },
   *   { name: 'Updated User' }
   * );
   */
  async upsert(where, create, update, options = {}) {
    const { include, select } = options;
    
    return this.model.upsert({
      where,
      create,
      update,
      ...(include && { include }),
      ...(select && { select })
    });
  }

  // ============================================
  // DELETE OPERATIONS
  // ============================================

  /**
   * Delete a single record
   * 
   * @param {Object} where - Where conditions
   * @returns {Promise<T>} Deleted record
   * @throws {Error} If record not found
   * 
   * @example
   * const deletedUser = await userRepo.delete({ id: 1 });
   */
  async delete(where) {
    return this.model.delete({ where });
  }

  /**
   * Delete multiple records
   * 
   * @param {Object} where - Where conditions
   * @returns {Promise<{count: number}>} Object with count of deleted records
   * 
   * @example
   * const result = await postRepo.deleteMany({ published: false });
   */
  async deleteMany(where) {
    return this.model.deleteMany({ where });
  }

  // ============================================
  // PAGINATION SUPPORT
  // ============================================

  /**
   * Find records with pagination
   * 
   * Returns paginated results with metadata
   * 
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number (1-based)
   * @param {number} [options.perPage=20] - Items per page
   * @param {Object} [options.where={}] - Where conditions
   * @param {Object} [options.include] - Relations to include
   * @param {Object} [options.select] - Fields to select
   * @param {Object} [options.orderBy] - Order by clause
   * @returns {Promise<Object>} Pagination result
   * @returns {T[]} return.data - Array of records
   * @returns {number} return.total - Total count of records
   * @returns {number} return.page - Current page
   * @returns {number} return.perPage - Items per page
   * @returns {number} return.totalPages - Total number of pages
   * @returns {boolean} return.hasNextPage - Whether there is a next page
   * @returns {boolean} return.hasPreviousPage - Whether there is a previous page
   * 
   * @example
   * const result = await postRepo.findPaginated({
   *   page: 2,
   *   perPage: 10,
   *   where: { published: true },
   *   orderBy: { createdAt: 'desc' }
   * });
   * result = { data: [...], total: 50, page: 2, perPage: 10, totalPages: 5, ... }
   */
  async findPaginated({ page = 1, perPage = 20, where = {}, ...options }) {
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: perPage,
        ...options
      }),
      this.count(where)
    ]);

    const totalPages = Math.ceil(total / perPage);

    return {
      data,
      total,
      page,
      perPage,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
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
   * @param {TemplateStringsArray} query - SQL query template
   * @param {...any} params - Query parameters
   * @returns {Promise<any>} Query result
   * 
   * @example
   * const result = await repo.rawQuery`
   *   SELECT * FROM users WHERE email = ${email}
   * `;
   */
  async rawQuery(query, ...params) {
    return this.prisma.$queryRaw(query, ...params);
  }

  /**
   * Execute raw SQL with unsafe string interpolation
   * 
   * @param {string} query - SQL query string
   * @returns {Promise<any>} Query result
   */
  async rawQueryUnsafe(query) {
    return this.prisma.$queryRawUnsafe(query);
  }

  /**
   * Execute raw SQL write operation
   * 
   * @param {TemplateStringsArray} query - SQL query template
   * @param {...any} params - Query parameters
   * @returns {Promise<number>} Number of affected rows
   */
  async executeRaw(query, ...params) {
    return this.prisma.$executeRaw(query, ...params);
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
   * @returns {Object} Prisma client instance
   * const prisma = repo.getPrismaClient();
   * const result = await prisma.user.findMany({
   *   where: { conditions },
   *   include: { relations }
   * }); 
   * @example
   */

  getPrismaClient() {
    return this.prisma;
  }

  /**
   * Get Prisma model delegate
   * 
   * Use this for direct access to the model's methods.
   * 
   * @returns {Object} Prisma model delegate
   * 
   * @example
   * const model = repo.getModel();
   * const result = await model.aggregate({
   *   _avg: { score: true },
   *   _count: true
   * });
   */
  getModel() {
    return this.model;
  }

  /**
   * Get model name
   * 
   * @returns {string} Model name
   */
  getModelName() {
    return this.modelName;
  }
}

module.exports = BaseRepository;
