/**
 * Base Controller
 *
 * Provides common functionality for all HTTP controllers in the application.
 * This class serves as a foundation for specific controllers,
 * ensuring consistent response formats, error handling, and request processing.
 *
 * Features:
 * - Standardized JSON response formats (success, error, paginated)
 * - HTTP parameter extraction helpers (params, query, body)
 * - Async error handling wrapper for route handlers
 * - Pagination support with metadata
 * - Built-in logging capabilities
 * - Authentication helpers
 * - Validation utilities
 *
 * @abstract
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ValidationError } from '../../shared/utils/error';
import logger from '../../shared/utils/logger';

/**
 * Pagination metadata structure
 */
export interface PaginationMetadata {
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
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  perPage: number;
}

/**
 * Pagination defaults configuration
 */
export interface PaginationDefaults {
  page?: number;
  perPage?: number;
  maxPerPage?: number;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

/**
 * User object from authenticated request
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  role?: string;
  [key: string]: unknown;
}

/**
 * Extended Express Request with user
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Base service interface
 */
export interface IBaseService {}

/**
 * Base Controller Abstract Class
 */
export abstract class BaseController<TService extends IBaseService = IBaseService> {
  protected readonly service: TService;
  protected readonly logger: typeof logger;

  /**
   * Create a base controller instance
   *
   * @param service - The service instance this controller uses
   * @throws {Error} If trying to instantiate abstract class directly
   */
  constructor(service: TService) {
    // Prevent direct instantiation of abstract class
    if (new.target === BaseController) {
      throw new Error('Cannot instantiate abstract class BaseController directly');
    }

    // Inject service dependency
    this.service = service;
    this.logger = logger;
  }

  // ============================================
  // RESPONSE HELPERS
  // ============================================

  /**
   * Send successful response with data
   *
   * Returns a standardized success response with the provided data.
   *
   * @param res - Express response object
   * @param data - Response data
   * @param statusCode - HTTP status code (default: 200)
   * @returns Express response
   *
   * @example
   * return this.success(res, { user: userData });
   * // Response: { success: true, data: { user: {...} } }
   */
  protected success<T = unknown>(res: Response, data: T, statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
    } as SuccessResponse<T>);
  }

  /**
   * Send created response (201)
   *
   * Convenience method for successful resource creation.
   *
   * @param res - Express response object
   * @param data - Created resource data
   * @returns Express response
   *
   * @example
   * return this.created(res, newUser);
   * // Response: { success: true, data: {...} } with status 201
   */
  protected created<T = unknown>(res: Response, data: T): Response {
    return this.success(res, data, 201);
  }

  /**
   * Send no content response (204)
   *
   * Used for successful operations with no return data (e.g., DELETE).
   *
   * @param res - Express response object
   * @returns Express response
   *
   * @example
   * return this.noContent(res);
   * // Response: Empty body with status 204
   */
  protected noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Send paginated response with metadata
   *
   * Returns data with comprehensive pagination information including
   * navigation flags and page numbers.
   *
   * @param res - Express response object
   * @param items - Array of items for current page
   * @param paginationMeta - Pagination metadata
   * @returns Express response
   *
   * @example
   * return this.paginated(res, animes, {
   *   currentPage: 1,
   *   perPage: 20,
   *   total: 100,
   *   totalPages: 5,
   *   hasNextPage: true,
   *   hasPreviousPage: false,
   *   nextPage: 2,
   *   previousPage: null
   * });
   */
  protected paginated<T = unknown>(
    res: Response,
    items: T[],
    paginationMeta: PaginationMetadata
  ): Response {
    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: paginationMeta.currentPage,
        perPage: paginationMeta.perPage,
        total: paginationMeta.total,
        totalPages: paginationMeta.totalPages,
        hasNextPage: paginationMeta.hasNextPage,
        hasPreviousPage: paginationMeta.hasPreviousPage,
        nextPage: paginationMeta.nextPage,
        previousPage: paginationMeta.previousPage,
      },
    } as PaginatedResponse<T>);
  }

  /**
   * Send error response
   *
   * Returns a standardized error response with optional details.
   *
   * @param res - Express response object
   * @param message - Error message
   * @param statusCode - HTTP status code (default: 500)
   * @param details - Additional error details (optional)
   * @returns Express response
   *
   * @example
   * return this.error(res, 'Not found', 404);
   */
  protected error(
    res: Response,
    message: string,
    statusCode: number = 500,
    details: unknown = null
  ): Response {
    const response: ErrorResponse = {
      success: false,
      error: {
        message,
        statusCode,
      },
    };

    if (details) {
      response.error.details = details;
    }

    return res.status(statusCode).json(response);
  }

  // ============================================
  // PARAMETER EXTRACTION HELPERS
  // ============================================

  /**
   * Extract and parse integer from route parameters
   *
   * @param req - Express request object
   * @param paramName - Name of the parameter
   * @returns Parsed integer value
   *
   * @example
   * // Route: /api/anime/:anilistId
   * const anilistId = this.getIntParam(req, 'anilistId');
   */
  protected getIntParam(req: Request, paramName: string): number {
    const value = req.params[paramName];
    return parseInt(value as string, 10);
  }

  /**
   * Extract and parse integer from query string
   *
   * @param req - Express request object
   * @param queryName - Name of the query parameter
   * @param defaultValue - Default value if not provided
   * @returns Parsed integer value or default
   *
   * @example
   * // Request: /api/anime?page=2
   * const page = this.getIntQuery(req, 'page', 1);
   */
  protected getIntQuery(
    req: Request,
    queryName: string,
    defaultValue: number | null = null
  ): number | null {
    const value = req.query[queryName];

    if (value === undefined || value === null) {
      return defaultValue;
    }

    const parsed = parseInt(value as string, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Extract string from query parameters
   *
   * @param req - Express request object
   * @param queryName - Name of the query parameter
   * @param defaultValue - Default value if not provided
   * @returns Query string value or default
   *
   * @example
   * // Request: /api/anime?season=summer
   * const season = this.getStringQuery(req, 'season', '');
   */
  protected getStringQuery(req: Request, queryName: string, defaultValue: string = ''): string {
    const value = req.query[queryName];
    return value !== undefined && value !== null ? String(value) : defaultValue;
  }

  /**
   * Extract pagination parameters from query string
   *
   * Validates and sanitizes pagination parameters to ensure they are within acceptable ranges.
   *
   * @param req - Express request object
   * @param defaults - Default pagination values
   * @returns Pagination parameters { page, perPage }
   *
   * @example
   * const { page, perPage } = this.getPaginationParams(req);
   * // Request: ?page=2&perPage=50
   * // Returns: { page: 2, perPage: 50 }
   */
  protected getPaginationParams(req: Request, defaults: PaginationDefaults = {}): PaginationParams {
    const { page: defaultPage = 1, perPage: defaultPerPage = 20, maxPerPage = 100 } = defaults;

    let page = this.getIntQuery(req, 'page', defaultPage) ?? defaultPage;
    let perPage = this.getIntQuery(req, 'perPage', defaultPerPage) ?? defaultPerPage;

    // Validate and sanitize
    page = Math.max(1, page);
    perPage = Math.min(maxPerPage, Math.max(1, perPage));

    return { page, perPage };
  }

  /**
   * Extract all query parameters as object
   *
   * @param req - Express request object
   * @returns Query parameters object
   *
   * @example
   * // Request: /api/anime?season=summer&year=2021
   * const queryParams = this.getQueryParams(req);
   * // Returns: { season: 'summer', year: '2021' }
   */
  protected getQueryParams(req: Request): Record<string, unknown> {
    return { ...req.query };
  }

  /**
   * Extract request body
   *
   * @param req - Express request object
   * @returns Request body
   *
   * @example
   * // Request body: { title: 'Naruto', episodes: 220 }
   * const body = this.getBody(req);
   * // Returns: { title: 'Naruto', episodes: 220 }
   */
  protected getBody<T = unknown>(req: Request): T {
    return (req.body || {}) as T;
  }

  /**
   * Extract user from authenticated request
   *
   * Assumes authentication middleware sets req.user
   *
   * @param req - Express request object
   * @returns User object or null
   *
   * @example
   * const user = this.getUser(req);
   * if (user) {
   *   // User is authenticated
   * }
   */
  protected getUser(req: AuthenticatedRequest): AuthenticatedUser | null {
    return req.user || null;
  }

  /**
   * Get user ID from authenticated request
   *
   * @param req - Express request object
   * @returns User ID or null
   *
   * @example
   * const userId = this.getUserId(req);
   */
  protected getUserId(req: AuthenticatedRequest): number | null {
    return req.user?.id || null;
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  /**
   * Wrap async route handler to catch errors
   *
   * Automatically passes errors to Express error handling middleware.
   * This eliminates the need for try-catch blocks in every route handler.
   *
   * @param fn - Async route handler function
   * @returns Express middleware function
   *
   * @example
   * router.get('/anime/:id', this.asyncHandler(async (req, res) => {
   *   const anime = await this.service.getAnime(req.params.id);
   *   return this.success(res, anime);
   * }));
   */
  protected asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn.call(this, req, res, next)).catch(next);
    };
  }

  /**
   * Handle controller-level errors
   *
   * Logs error details and passes to Express error handler middleware.
   * Can be overridden by subclasses for custom error handling.
   *
   * @param error - Error object
   * @param req - Express request object
   * @param next - Express next function
   *
   * @example
   * this.handleError(error, req, next);
   */
  protected handleError(error: Error, req: Request, next: NextFunction): void {
    this.logger.error(`[${this.constructor.name}] Error in ${req.method} ${req.path}`, {
      error: error.message,
      stack: error.stack,
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
    });

    // Pass to Express error handler middleware
    next(error);
  }

  // ============================================
  // LOGGING HELPERS
  // ============================================

  /**
   * Log info message with controller context
   *
   * @param message - Log message
   * @param meta - Additional metadata (optional)
   *
   * @example
   * this.logInfo('Fetching anime list', { page: 1 });
   */
  protected logInfo(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.info(`[${this.constructor.name}] ${message}`, meta);
  }

  /**
   * Log warning message with controller context
   *
   * @param message - Log message
   * @param meta - Additional metadata (optional)
   *
   * @example
   * this.logWarn('Invalid pagination parameters', { page: -1 });
   */
  protected logWarn(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.warn(`[${this.constructor.name}] ${message}`, meta);
  }

  /**
   * Log error message with controller context
   *
   * @param message - Log message
   * @param meta - Additional metadata (optional)
   *
   * @example
   * this.logError('Failed to fetch anime', { error: error.message });
   */
  protected logError(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.error(`[${this.constructor.name}] ${message}`, meta);
  }

  /**
   * Log debug message with controller context
   *
   * @param message - Log message
   * @param meta - Additional metadata (optional)
   *
   * @example
   * this.logDebug('Processing request', { params: req.params });
   */
  protected logDebug(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.debug(`[${this.constructor.name}] ${message}`, meta);
  }

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  /**
   * Validate required parameters exist
   *
   * Checks if all required fields are present in the provided parameters object.
   *
   * @param params - Parameters object
   * @param requiredFields - Array of required field names
   * @throws {ValidationError} If required fields are missing
   *
   * @example
   * this.validateRequired(req.body, ['title', 'episodes']);
   * // Throws ValidationError if title or episodes is missing
   */
  protected validateRequired(params: Record<string, unknown>, requiredFields: string[]): void {
    const missing: string[] = [];

    for (const field of requiredFields) {
      if (params[field] === undefined || params[field] === null) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Check if request has valid authentication
   *
   * @param req - Express request object
   * @returns True if authenticated
   *
   * @example
   * if (this.isAuthenticated(req)) {
   *   // Process authenticated request
   * }
   */
  protected isAuthenticated(req: AuthenticatedRequest): boolean {
    return !!req.user;
  }

  /**
   * Require authentication, throw error if not authenticated
   *
   * @param req - Express request object
   * @throws {Error} If not authenticated (401)
   *
   * @example
   * this.requireAuth(req);
   * // Throws error if user is not authenticated
   */
  protected requireAuth(req: AuthenticatedRequest): void {
    if (!this.isAuthenticated(req)) {
      const error = new Error('Authentication required') as unknown & { statusCode?: number };
      error.statusCode = 401;
      throw error;
    }
  }
}

export default BaseController;
