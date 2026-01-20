/**
 * Repository Types
 *
 * Type definitions specific to the repository/data access layer.
 * These types work with TypeORM and provide type-safe database operations.
 */

import type { EntityManager } from 'typeorm';
import type { PaginatedResult } from './common';

/**
 * TypeORM transaction manager type
 */
export type TransactionManager = EntityManager;

/**
 * TypeORM transaction isolation levels
 */
export type IsolationLevel =
  | 'READ UNCOMMITTED'
  | 'READ COMMITTED'
  | 'REPEATABLE READ'
  | 'SERIALIZABLE';

/**
 * Base where clause (generic)
 */
export type WhereClause<T = unknown> = Partial<T> | Record<string, unknown>;

/**
 * Base select clause
 */
export type SelectClause = Record<string, boolean>;

/**
 * Base include clause
 */
export type IncludeClause = Record<string, boolean | object>;

/**
 * Order by clause
 */
export type OrderByClause = Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;

/**
 * Find options for a single record
 */
export interface FindOneOptions {
  select?: SelectClause;
  include?: IncludeClause;
}

/**
 * Find options for multiple records
 */
export interface FindManyOptions extends FindOneOptions {
  where?: WhereClause;
  orderBy?: OrderByClause;
  skip?: number;
  take?: number;
  cursor?: unknown;
  distinct?: string | string[];
}

/**
 * Create options
 */
export interface CreateOptions {
  select?: SelectClause;
  include?: IncludeClause;
}

/**
 * Update options
 */
export interface UpdateOptions extends CreateOptions {
  where?: WhereClause;
}

/**
 * Delete options
 */
export interface DeleteOptions {
  where?: WhereClause;
}

/**
 * Count options
 */
export interface CountOptions {
  where?: WhereClause;
  skip?: number;
  take?: number;
}

/**
 * Aggregate options
 */
export interface AggregateOptions {
  where?: WhereClause;
  orderBy?: OrderByClause;
  skip?: number;
  take?: number;
}

/**
 * Upsert options (update or create)
 */
export interface UpsertOptions<CreateData, UpdateData> {
  where: WhereClause;
  create: CreateData;
  update: UpdateData;
  select?: SelectClause;
  include?: IncludeClause;
}

/**
 * Batch operation result
 */
export interface BatchResult {
  count: number;
}

/**
 * Repository query builder
 */

export interface QueryBuilder<T> {
  where(_clause: WhereClause<T>): this;
  orderBy(_field: keyof T, _order: 'asc' | 'desc'): this;
  skip(_count: number): this;
  take(_count: number): this;
  include(_relations: IncludeClause): this;
  select(_fields: SelectClause): this;
  execute(): Promise<T[]>;
  first(): Promise<T | null>;
  count(): Promise<number>;
}

/**
 * Repository with raw query support
 */

export interface RawQueryCapable {
  /**
   * Execute raw SQL query
   */
  executeRaw(_query: string, _params?: unknown[]): Promise<unknown>;

  /**
   * Execute raw SQL query and return results
   */
  queryRaw<T = unknown>(_query: string, _params?: unknown[]): Promise<T[]>;
}

/**
 * Bulk operation options
 */
export interface BulkCreateOptions {
  skipDuplicates?: boolean;
}

export interface BulkUpdateOptions {
  where: WhereClause;
  data: Record<string, unknown>;
}

export interface BulkDeleteOptions {
  where: WhereClause;
}

/**
 * Prisma model delegates (for type inference)
 */
export type PrismaModelDelegate = {
  findUnique: Function;
  findFirst: Function;
  findMany: Function;
  create: Function;
  update: Function;
  delete: Function;
  count: Function;
  aggregate: Function;
  groupBy: Function;
  upsert: Function;
  createMany: Function;
  updateMany: Function;
  deleteMany: Function;
};

/**
 * Repository pagination result
 */
export interface RepositoryPaginatedResult<T> extends PaginatedResult<T> {
  query?: {
    where?: WhereClause;
    orderBy?: OrderByClause;
  };
}

/**
 * Repository factory function type
 */
export type RepositoryFactory<T> = (_manager: EntityManager) => T;

/**
 * Soft delete fields
 */
export interface SoftDeleteFields {
  deletedAt: Date | null;
}

/**
 * Timestamp fields
 */
export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full entity fields (with ID, timestamps, soft delete)
 */
export interface EntityFields extends TimestampFields {
  id: number | bigint;
  deletedAt?: Date | null;
}

/**
 * Create input (omit auto-generated fields)
 */
export type CreateInput<T extends EntityFields> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Update input (omit ID and timestamps)
 */
export type UpdateInput<T extends EntityFields> = Partial<
  Omit<T, 'id' | 'createdAt' | 'updatedAt'>
>;

/**
 * Where input (for queries)
 */
export type WhereInput<T> = Partial<T> & {
  AND?: WhereInput<T>[];
  OR?: WhereInput<T>[];
  NOT?: WhereInput<T>[];
};

/**
 * Order by input
 */
export type OrderByInput<T> = {
  [K in keyof T]?: 'asc' | 'desc';
};

/**
 * Relation loading strategy
 */
export type RelationLoadStrategy = 'join' | 'query';

/**
 * Include with relation loading strategy
 */
export type IncludeWithStrategy = IncludeClause & {
  _strategy?: RelationLoadStrategy;
};

/**
 * Repository error types
 */
export enum RepositoryErrorType {
  NOT_FOUND = 'NOT_FOUND',
  UNIQUE_CONSTRAINT = 'UNIQUE_CONSTRAINT',
  FOREIGN_KEY_CONSTRAINT = 'FOREIGN_KEY_CONSTRAINT',
  VALIDATION = 'VALIDATION',
  TRANSACTION = 'TRANSACTION',
  CONNECTION = 'CONNECTION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Repository error
 */
export interface RepositoryError extends Error {
  type: RepositoryErrorType;
  field?: string;
  constraint?: string;
  meta?: Record<string, unknown>;
}

/**
 * Transaction callback type
 */
export type TransactionCallback<T> = (_tx: TransactionManager) => Promise<T>;

/**
 * Transaction options
 */
export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: IsolationLevel;
}

/**
 * Repository event types
 */
export enum RepositoryEvent {
  BEFORE_CREATE = 'beforeCreate',
  AFTER_CREATE = 'afterCreate',
  BEFORE_UPDATE = 'beforeUpdate',
  AFTER_UPDATE = 'afterUpdate',
  BEFORE_DELETE = 'beforeDelete',
  AFTER_DELETE = 'afterDelete',
}

/**
 * Repository event handler
 */
export type RepositoryEventHandler<T> = (_data: T) => void | Promise<void>;

/**
 * Repository with events
 */
export interface EventEmittingRepository<T> {
  on(_event: RepositoryEvent, _handler: RepositoryEventHandler<T>): void;
  off(_event: RepositoryEvent, _handler: RepositoryEventHandler<T>): void;
  emit(_event: RepositoryEvent, _data: T): Promise<void>;
}

/**
 * Cursor-based pagination
 */
export interface CursorPaginationOptions {
  cursor?: unknown;
  take: number;
  skip?: number;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  cursor: unknown | null;
  hasMore: boolean;
}
