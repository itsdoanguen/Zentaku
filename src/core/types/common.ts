/**
 * Common Types
 *
 * Shared type definitions used across the application.
 * These types provide consistency for common patterns like pagination,
 * validation, error handling, and data transformation.
 */

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
  constraint?: string;
}

/**
 * String validation options
 */
export interface StringValidationOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowEmpty?: boolean;
  trim?: boolean;
}

/**
 * Number validation options
 */
export interface NumberValidationOptions {
  min?: number;
  max?: number;
  integer?: boolean;
  positive?: boolean;
}

/**
 * Common entity timestamps
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Entity with ID
 */
export interface WithId {
  id: number | bigint;
}

/**
 * Soft deletable entity
 */
export interface SoftDeletable {
  deletedAt: Date | null;
  isDeleted: boolean;
}

/**
 * Sortable options
 */
export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Filter operator
 */
export type FilterOperator =
  | 'equals'
  | 'not'
  | 'in'
  | 'notIn'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'contains'
  | 'startsWith'
  | 'endsWith';

/**
 * Filter condition
 */
export interface FilterCondition<T = unknown> {
  field: string;
  operator: FilterOperator;
  value: T;
}

/**
 * Search options
 */
export interface SearchOptions {
  query?: string;
  filters?: FilterCondition[];
  sort?: SortOptions[];
  pagination?: PaginationOptions;
}

/**
 * Result with metadata
 */
export interface ResultWithMeta<T, M = Record<string, unknown>> {
  data: T;
  meta: M;
}

/**
 * Async result (for operations that may take time)
 */
export interface AsyncResult<T> {
  status: 'pending' | 'completed' | 'failed';
  data?: T;
  error?: Error;
  progress?: number;
}

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  data: T;
  cachedAt: Date;
  expiresAt?: Date;
  key: string;
}

/**
 * Partial deep (recursive partial)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make required fields from partial type
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Omit type with support for nested keys
 */
export type OmitNested<T, K extends string> = T extends object
  ? {
      [P in Exclude<keyof T, K>]: T[P];
    }
  : T;

/**
 * Pick type with support for nested keys
 */
export type PickNested<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Nullable type
 */
export type Nullable<T> = T | null;

/**
 * Optional type
 */
export type Optional<T> = T | undefined;

/**
 * Maybe type (nullable or undefined)
 */
export type Maybe<T> = T | null | undefined;

/**
 * Constructor type
 */
// eslint-disable-next-line no-unused-vars
export type Constructor<T = object> = new (...args: unknown[]) => T;

/**
 * Abstract constructor type
 */
// eslint-disable-next-line no-unused-vars
export type AbstractConstructor<T = object> = abstract new (...args: unknown[]) => T;

/**
 * Function type
 */
// eslint-disable-next-line no-unused-vars
export type Func<Args extends unknown[] = unknown[], Return = unknown> = (..._args: Args) => Return;

/**
 * Async function type
 */
export type AsyncFunc<Args extends unknown[] = unknown[], Return = unknown> = (
  // eslint-disable-next-line no-unused-vars
  ..._args: Args
) => Promise<Return>;

/**
 * Void function type
 */
export type VoidFunc<Args extends unknown[] = unknown[]> = Func<Args, void>;

/**
 * Async void function type
 */
export type AsyncVoidFunc<Args extends unknown[] = unknown[]> = AsyncFunc<Args, void>;

/**
 * ID type (can be number or bigint)
 */
export type ID = number | bigint;

/**
 * String or number
 */
export type Primitive = string | number | boolean | null | undefined;

/**
 * JSON value type
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

/**
 * JSON object type
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * JSON array type
 */
export interface JsonArray extends Array<JsonValue> {}

/**
 * Error with code
 */
export interface ErrorWithCode extends Error {
  code: string;
  statusCode?: number;
}

/**
 * Success/Error result type (Either monad)
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Enum values type helper
 */
export type EnumValues<T extends Record<string, unknown>> = T[keyof T];

/**
 * Key-value pair
 */
export interface KeyValuePair<K = string, V = unknown> {
  key: K;
  value: V;
}

/**
 * Dictionary type
 */
export type Dictionary<T = unknown> = Record<string, T>;

/**
 * Readonly dictionary
 */
export type ReadonlyDictionary<T = unknown> = Readonly<Record<string, T>>;

/**
 * Empty object type
 */
export type EmptyObject = Record<string, never>;

/**
 * Non-empty array
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Tuple to union
 */
export type TupleToUnion<T extends readonly unknown[]> = T[number];

/**
 * Union to intersection
 */
// eslint-disable-next-line no-unused-vars
export type UnionToIntersection<U> = (U extends unknown ? (_k: U) => void : never) extends (
  // eslint-disable-next-line no-unused-vars
  _k: infer I
) => void
  ? I
  : never;

/**
 * Awaited type (unwrap Promise)
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Extract type from array
 */
export type ArrayElement<T> = T extends (infer E)[] ? E : T;

/**
 * Mutable type (remove readonly)
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Deep readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
