/**
 * Base Controller
 *
 * Provides common functionality for all HTTP controllers in the application.
 * This class serves as a foundation for specific controllers,
 * ensuring consistent response formats, error handling, and request processing.
 *
 * @abstract
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ValidationError } from '../../shared/utils/error';
import logger from '../../shared/utils/logger';

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
export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginationDefaults {
  page?: number;
  perPage?: number;
  maxPerPage?: number;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: PaginationMetadata;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

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
    if (new.target === BaseController) {
      throw new Error('Cannot instantiate abstract class BaseController directly');
    }

    this.service = service;
    this.logger = logger;
  }

  // ============================================
  // RESPONSE HELPERS
  // ============================================

  // Send successful response with data
  protected success<T = unknown>(res: Response, data: T, statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
    } as SuccessResponse<T>);
  }

  // Send created response (201)
  protected created<T = unknown>(res: Response, data: T): Response {
    return this.success(res, data, 201);
  }

  // Send no content response (204)
  protected noContent(res: Response): Response {
    return res.status(204).send();
  }

  // Send paginated response with metadata
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

  // Send error response
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

  // Extract and parse integer from route parameters
  protected getIntParam(req: Request, paramName: string): number {
    const value = req.params[paramName];
    return parseInt(value as string, 10);
  }

  // Extract and parse integer from query string
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

  // Extract string from query parameters
  protected getStringQuery(req: Request, queryName: string, defaultValue: string = ''): string {
    const value = req.query[queryName];
    return value !== undefined && value !== null ? String(value) : defaultValue;
  }

  // Extract pagination parameters from query string
  protected getPaginationParams(req: Request, defaults: PaginationDefaults = {}): PaginationParams {
    const { page: defaultPage = 1, perPage: defaultPerPage = 20, maxPerPage = 100 } = defaults;

    let page = this.getIntQuery(req, 'page', defaultPage) ?? defaultPage;
    let perPage = this.getIntQuery(req, 'perPage', defaultPerPage) ?? defaultPerPage;

    page = Math.max(1, page);
    perPage = Math.min(maxPerPage, Math.max(1, perPage));

    return { page, perPage };
  }

  // Extract all query parameters as object
  protected getQueryParams(req: Request): Record<string, unknown> {
    return { ...req.query };
  }

  // Extract request body
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
   */
  protected getUser(req: AuthenticatedRequest): AuthenticatedUser | null {
    return req.user || null;
  }

  protected getUserId(req: AuthenticatedRequest): number | null {
    return req.user?.id || null;
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  // Wrap async route handler to catch errors
  protected asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn.call(this, req, res, next)).catch(next);
    };
  }

  // Handle controller-level errors
  protected handleError(error: Error, req: Request, next: NextFunction): void {
    this.logger.error(`[${this.constructor.name}] Error in ${req.method} ${req.path}`, {
      error: error.message,
      stack: error.stack,
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query,
    });

    next(error);
  }

  // ============================================
  // LOGGING HELPERS
  // ============================================

  protected logInfo(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.info(`[${this.constructor.name}] ${message}`, meta);
  }

  protected logWarn(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.warn(`[${this.constructor.name}] ${message}`, meta);
  }

  protected logError(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.error(`[${this.constructor.name}] ${message}`, meta);
  }

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

  protected isAuthenticated(req: AuthenticatedRequest): boolean {
    return !!req.user;
  }

  protected requireAuth(req: AuthenticatedRequest): void {
    if (!this.isAuthenticated(req)) {
      const error = new Error('Authentication required') as unknown & { statusCode?: number };
      error.statusCode = 401;
      throw error;
    }
  }
}

export default BaseController;
