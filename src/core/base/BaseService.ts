/**
 * Base Service
 *
 * Provides common functionality for all service layer classes.
 * This class serves as a foundation for specific services,
 * ensuring consistent patterns for validation, error handling, logging, and pagination.
 *
 * Features:
 * - Input validation (IDs, strings, enums)
 * - Pagination support with metadata
 * - Standardized error handling
 * - Shared logging utilities
 * - Common utility methods (retry, sleep, date calculations)
 *
 * @abstract
 */

import { AnilistAPIError, NotFoundError, ValidationError } from '../../shared/utils/error';
import logger from '../../shared/utils/logger';

/**
 * Options for string validation
 */
export interface StringValidationOptions {
  minLength?: number;
  maxLength?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
}

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

/**
 * Base Service Abstract Class
 */
export abstract class BaseService {
  protected readonly logger: typeof logger;

  /**
   * Create a base service instance
   *
   * @throws {TypeError} If trying to instantiate abstract class directly
   */
  constructor() {
    if (new.target === BaseService) {
      throw new TypeError('Cannot construct BaseService instances directly');
    }

    this.logger = logger;
  }

  // ============================================
  // VALIDATION METHODS
  // ============================================

  /**
   * Validates that the provided ID is a positive integer
   *
   * @param id - The ID to validate
   * @param fieldName - The name of the field being validated (for error messages)
   * @returns The validated positive integer ID
   * @throws {ValidationError} If the ID is not a positive integer
   *
   * @example
   * const animeId = this._validateId(params.id, 'Anime ID');
   * // Returns: 123 (validated number)
   * // Throws: ValidationError if invalid
   */
  protected _validateId(id: unknown, fieldName: string = 'ID'): number {
    if (id === null || id === undefined) {
      throw new ValidationError(`${fieldName} is required.`);
    }

    const numericId = Number(id);

    if (!Number.isInteger(numericId)) {
      throw new ValidationError(`${fieldName} must be an integer`);
    }

    if (numericId <= 0) {
      throw new ValidationError(`${fieldName} must be a positive integer`);
    }

    return numericId;
  }

  /**
   * Validate that a string meets specified criteria
   *
   * @param str - The string to validate
   * @param fieldName - The name of the field being validated (for error messages)
   * @param options - Additional validation options (minLength, maxLength)
   * @returns The validated and trimmed string
   * @throws {ValidationError} If the string is invalid
   *
   * @example
   * const title = this._validateString(data.title, 'Title', {
   *   minLength: 3,
   *   maxLength: 100
   * });
   */
  protected _validateString(
    str: unknown,
    fieldName: string = 'String',
    options: StringValidationOptions = {}
  ): string {
    const { minLength = 1, maxLength = Infinity } = options;

    if (str === null || str === undefined) {
      throw new ValidationError(`${fieldName} is required.`);
    }

    if (typeof str !== 'string') {
      throw new ValidationError(`${fieldName} must be a string.`);
    }

    const trimmedStr = str.trim();

    if (trimmedStr.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters long.`);
    }

    if (trimmedStr.length > maxLength) {
      throw new ValidationError(`${fieldName} must be at most ${maxLength} characters long.`);
    }

    return trimmedStr;
  }

  /**
   * Validate that a value is in an allowed list of values
   *
   * @param value - The value to validate
   * @param allowedValues - List of allowed values
   * @param fieldName - The name of the field being validated (for error messages)
   * @returns The validated value
   * @throws {ValidationError} If the value is not in the allowed list
   *
   * @example
   * const status = this._validateEnum(
   *   data.status,
   *   ['CURRENT', 'COMPLETED', 'PLANNING'] as const,
   *   'Status'
   * );
   */
  protected _validateEnum<T>(
    value: T,
    allowedValues: readonly T[],
    fieldName: string = 'Value'
  ): T {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }

    return value;
  }

  // ============================================
  // PAGINATION SUPPORT
  // ============================================

  /**
   * Calculates pagination parameters from page and pageSize
   *
   * Automatically validates and caps values to prevent abuse.
   * Maximum page size is limited to 100 items.
   *
   * @param page - Current page number (1-based, default: 1)
   * @param pageSize - Number of items per page (default: 20, max: 100)
   * @returns Pagination parameters including skip, take, page, and pageSize
   *
   * @example
   * const { skip, take } = this._getPaginationParams(2, 20);
   * // Returns: { skip: 20, take: 20, page: 2, pageSize: 20 }
   */
  protected _getPaginationParams(page: number = 1, pageSize: number = 20): PaginationParams {
    const validatePage = Math.max(1, parseInt(String(page), 10) || 1);
    const validatePageSize = Math.max(1, parseInt(String(pageSize), 10) || 20);
    const validatePerPage = Math.min(100, validatePageSize);

    return {
      skip: (validatePage - 1) * validatePerPage,
      take: validatePerPage,
      page: validatePage,
      pageSize: validatePerPage,
    };
  }

  /**
   * Calculates total number of pages from total count and page size
   *
   * @param totalCount - Total number of items
   * @param pageSize - Number of items per page
   * @returns Total number of pages
   *
   * @example
   * const totalPages = this._getTotalPages(95, 20);
   * // Returns: 5
   */
  protected _getTotalPages(totalCount: number, pageSize: number): number {
    return Math.ceil(totalCount / pageSize);
  }

  /**
   * Build complete pagination metadata for API responses
   *
   * Creates a comprehensive metadata object with current page info,
   * total counts, and navigation flags.
   *
   * @param page - Current page number
   * @param perPage - Items per page
   * @param total - Total number of items
   * @returns Complete pagination metadata object
   *
   * @example
   * const meta = this._buildPaginationMeta(2, 20, 95);
   * // Returns: {
   * //   currentPage: 2,
   * //   perPage: 20,
   * //   total: 95,
   * //   totalPages: 5,
   * //   hasNextPage: true,
   * //   hasPreviousPage: true,
   * //   nextPage: 3,
   * //   previousPage: 1
   * // }
   */
  protected _buildPaginationMeta(page: number, perPage: number, total: number): PaginationMeta {
    const totalPages = this._getTotalPages(total, perPage);

    return {
      currentPage: page,
      perPage,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };
  }

  // ============================================
  // ERROR HANDLING UTILITIES
  // ============================================

  /**
   * Handle and standardize errors with logging
   *
   * Logs the error with context and re-throws known application errors.
   * Wraps unknown errors in a generic service error.
   *
   * @param error - The error to handle
   * @param context - Context where error occurred (optional)
   * @throws Re-throws the error after logging
   *
   * @example
   * try {
   *   // ... operation
   * } catch (error) {
   *   this._handleError(error as Error, 'fetching anime');
   * }
   */
  protected _handleError(error: Error, context: string = ''): never {
    const errorContext = context
      ? `[${this.constructor.name}] ${context}`
      : `[${this.constructor.name}]`;

    this.logger.error(`${errorContext}: ${error.message}`, {
      stack: error.stack,
      name: error.name,
    });

    // Re-throw known errors without modification
    if (
      error instanceof NotFoundError ||
      error instanceof ValidationError ||
      error instanceof AnilistAPIError
    ) {
      throw error;
    }

    // Wrap unknown errors
    throw new Error(`Service error: ${error.message}`);
  }

  /**
   * Safely execute an async operation with automatic error handling
   *
   * Wraps the operation in try-catch and delegates error handling
   * to _handleError method.
   *
   * @param operation - Async function to execute
   * @param context - Context for error messages
   * @returns Result of the operation
   *
   * @example
   * return this._executeWithErrorHandling(
   *   async () => await this.repository.findById(id),
   *   'fetching anime by ID'
   * );
   */
  protected async _executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this._handleError(error as Error, context);
    }
  }

  // ============================================
  // LOGGING UTILITIES
  // ============================================

  /**
   * Log info message with service context
   *
   * @param message - Message to log
   * @param meta - Additional metadata (optional)
   *
   * @example
   * this._logInfo('Anime fetched successfully', { animeId: 123 });
   */
  protected _logInfo(message: string, meta: unknown = {}): void {
    this.logger.info(`[${this.constructor.name}] ${message}`, meta);
  }

  /**
   * Log warning message with service context
   *
   * @param message - Message to log
   * @param meta - Additional metadata (optional)
   *
   * @example
   * this._logWarn('Cache miss, fetching from API', { key: 'anime:123' });
   */
  protected _logWarn(message: string, meta: unknown = {}): void {
    this.logger.warn(`[${this.constructor.name}] ${message}`, meta);
  }

  /**
   * Log error message with service context
   *
   * @param message - Message to log
   * @param meta - Additional metadata (optional)
   *
   * @example
   * this._logError('Failed to fetch anime', { error: error.message });
   */
  protected _logError(message: string, meta: unknown = {}): void {
    this.logger.error(`[${this.constructor.name}] ${message}`, meta);
  }

  /**
   * Log debug message with service context
   *
   * @param message - Message to log
   * @param meta - Additional metadata (optional)
   *
   * @example
   * this._logDebug('Processing anime data', { rawData });
   */
  protected _logDebug(message: string, meta: unknown = {}): void {
    this.logger.debug(`[${this.constructor.name}] ${message}`, meta);
  }

  // ============================================
  // COMMON UTILITY METHODS
  // ============================================

  /**
   * Check if value exists (not null or undefined)
   *
   * @param value - Value to check
   * @returns True if value exists, false otherwise
   *
   * @example
   * if (this._exists(data.description)) {
   *   // ... process description
   * }
   */
  protected _exists(value: unknown): boolean {
    return value !== null && value !== undefined;
  }

  /**
   * Check if string is empty or contains only whitespace
   *
   * @param str - String to check
   * @returns True if empty or whitespace, false otherwise
   *
   * @example
   * if (!this._isEmpty(title)) {
   *   // ... process title
   * }
   */
  protected _isEmpty(str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
  }

  /**
   * Safely parse JSON string with fallback
   *
   * @param jsonString - JSON string to parse
   * @param defaultValue - Default value if parsing fails (default: null)
   * @returns Parsed object or default value
   *
   * @example
   * const config = this._parseJSON<AppConfig>(
   *   data.settings,
   *   { theme: 'dark' }
   * );
   */
  protected _parseJSON<T = unknown>(jsonString: string, defaultValue: T | null = null): T | null {
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      this._logWarn(`Failed to parse JSON: ${(error as Error).message}`);
      return defaultValue;
    }
  }

  // ============================================
  // ASYNC UTILITIES
  // ============================================

  /**
   * Sleep/delay execution for specified milliseconds
   *
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   *
   * @example
   * await this._sleep(1000); // Wait 1 second
   */
  protected async _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry an async operation with exponential backoff
   *
   * Automatically retries failed operations with increasing delays.
   * Delay doubles after each attempt plus random jitter.
   *
   * @param operation - Async operation to retry
   * @param maxRetries - Maximum number of retries (default: 3)
   * @param baseDelay - Base delay in ms, doubles each retry (default: 1000)
   * @returns Result of the operation
   * @throws Last error if all retries fail
   *
   * @example
   * const data = await this._retryWithBackoff(
   *   async () => await externalAPI.fetch(id),
   *   3,
   *   1000
   * );
   */
  protected async _retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
          this._logWarn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await this._sleep(delay);
        } else {
          this._logError(`All ${maxRetries} attempts failed`);
        }
      }
    }

    throw lastError;
  }

  // ============================================
  // DATE/TIME HELPER METHODS
  // ============================================

  /**
   * Calculate the number of days between two dates
   *
   * @param date1 - First date
   * @param date2 - Second date
   * @returns Number of days between the dates (absolute value)
   *
   * @example
   * const days = this._daysBetween(new Date('2024-01-01'), new Date('2024-01-15'));
   * // Returns: 14
   */
  protected _daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if a date is older than specified number of days
   *
   * Returns true if date is null/undefined (considered stale).
   *
   * @param date - Date to check (can be Date, string, or null/undefined)
   * @param days - Number of days threshold
   * @returns True if date is older than specified days or null/undefined
   *
   * @example
   * if (this._isOlderThan(cachedData.timestamp, 7)) {
   *   // Cache is older than 7 days, refresh
   * }
   */
  protected _isOlderThan(date: Date | string | null | undefined, days: number): boolean {
    if (!date) return true;
    const daysDiff = this._daysBetween(new Date(date), new Date());
    return daysDiff >= days;
  }
}

export default BaseService;
