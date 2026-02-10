/**
 * Base Repository
 *
 * Provides common TypeORM CRUD operations for all repositories.
 * This class serves as a foundation for specific repositories,
 * eliminating code duplication and ensuring consistent data access patterns.
 *
 * @abstract
 * @template T - Entity type
 */

import type {
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  FindManyOptions as TypeORMFindManyOptions,
} from 'typeorm';

export interface FindOneOptions<T = any> {
  where?: FindOptionsWhere<T>;
  relations?: string[];
  select?: (keyof T)[];
  order?: TypeORMFindManyOptions<T>['order'];
}

export interface FindManyOptions<T = any> {
  where?: FindOptionsWhere<T>;
  relations?: string[];
  select?: (keyof T)[];
  order?: TypeORMFindManyOptions<T>['order'];
  skip?: number;
  take?: number;
}

export interface BatchResult {
  count: number;
}

export interface PaginationOptions<T = any> extends Omit<FindManyOptions<T>, 'skip' | 'take'> {
  page?: number;
  perPage?: number;
}

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
export abstract class BaseRepository<T extends ObjectLiteral = ObjectLiteral> {
  protected readonly repository: Repository<T>;

  /**
   * Create a base repository instance
   *
   * @param repository - TypeORM repository instance
   * @throws {Error} If trying to instantiate abstract class directly
   * @throws {Error} If repository is not provided
   */
  constructor(repository: Repository<T>) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository is abstract and cannot be instantiated directly');
    }

    if (!repository) {
      throw new Error('Repository is required');
    }

    this.repository = repository;
  }

  // ==================== BASIC CRUD ====================

  async findById(id: number | bigint, options?: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
      relations: options?.relations,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: options?.select as any,
      order: options?.order,
    });
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne({
      where: options.where,
      relations: options.relations,
      select: options.select as any,
      order: options.order,
    });
  }

  async findMany(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      where: options?.where,
      relations: options?.relations,
      select: options?.select as any,
      order: options?.order,
      skip: options?.skip,
      take: options?.take,
    });
  }

  async findAll(options?: Omit<FindManyOptions<T>, 'skip' | 'take'>): Promise<T[]> {
    return this.findMany(options);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async createMany(dataArray: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.repository.create(dataArray);
    return this.repository.save(entities);
  }

  async update(id: number | bigint, data: DeepPartial<T>): Promise<T | null> {
    await this.repository.update({ id } as unknown as FindOptionsWhere<T>, data as any);
    return this.findById(id);
  }

  async updateMany(where: FindOptionsWhere<T>, data: DeepPartial<T>): Promise<BatchResult> {
    const result = await this.repository.update(where, data as any);
    return { count: result.affected || 0 };
  }

  async delete(id: number | bigint): Promise<boolean> {
    const result = await this.repository.delete({ id } as unknown as FindOptionsWhere<T>);
    return (result.affected || 0) > 0;
  }

  async deleteMany(where: FindOptionsWhere<T>): Promise<BatchResult> {
    const result = await this.repository.delete(where);
    return { count: result.affected || 0 };
  }

  async softDelete(id: number | bigint): Promise<boolean> {
    const result = await this.repository.softDelete({ id } as unknown as FindOptionsWhere<T>);
    return (result.affected || 0) > 0;
  }

  async restore(id: number | bigint): Promise<boolean> {
    const result = await this.repository.restore({ id } as unknown as FindOptionsWhere<T>);
    return (result.affected || 0) > 0;
  }

  // ==================== QUERY OPERATIONS ====================

  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where });
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  async paginate(options: PaginationOptions<T>): Promise<PaginatedResult<T>> {
    const page = Math.max(options.page || 1, 1);
    const perPage = Math.max(options.perPage || 10, 1);
    const skip = (page - 1) * perPage;

    const [data, total] = await this.repository.findAndCount({
      where: options.where,
      relations: options.relations,
      select: options.select as any,
      order: options.order,
      skip,
      take: perPage,
    });

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

  // ==================== ADVANCED OPERATIONS ====================

  //insert or update
  async upsert(where: FindOptionsWhere<T>, data: DeepPartial<T>): Promise<T> {
    const existing = await this.findOne({ where });

    if (existing) {
      return this.update((existing as any).id, data) as Promise<T>;
    }

    return this.create(data);
  }

  getRepository(): Repository<T> {
    return this.repository;
  }

  async query<R = any>(query: string, parameters?: any[]): Promise<R> {
    return this.repository.query(query, parameters);
  }
}
