/**
 * Base Controller Interface
 *
 * Defines contracts for HTTP request handlers in the presentation layer.
 * Controllers handle HTTP-specific concerns (request/response, status codes, etc.)
 */

import type { NextFunction, Request, Response } from 'express';

/**
 * API Response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * Paginated API Response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Async request handler type
 */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Request handler type (sync or async)
 */
export type RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Response | Promise<void | Response>;

/**
 * Base Controller Interface
 */
export interface IController {
  /**
   * Controller name for identification
   */
  readonly controllerName?: string;
}

/**
 * CRUD Controller Interface
 * Standard REST operations
 */
export interface ICRUDController extends IController {
  /**
   * GET /resource - Get all resources
   */
  getAll: AsyncRequestHandler;

  /**
   * GET /resource/:id - Get single resource
   */
  getById: AsyncRequestHandler;

  /**
   * POST /resource - Create resource
   */
  create: AsyncRequestHandler;

  /**
   * PUT /resource/:id - Update resource
   */
  update: AsyncRequestHandler;

  /**
   * DELETE /resource/:id - Delete resource
   */
  delete: AsyncRequestHandler;
}

/**
 * Paginated Controller Interface
 * For controllers supporting pagination
 */
export interface IPaginatedController extends IController {
  /**
   * GET /resource?page=1&limit=10
   */
  getPaginated: AsyncRequestHandler;
}

/**
 * Search Controller Interface
 * For controllers supporting search
 */
export interface ISearchController extends IController {
  /**
   * GET /resource/search?q=query
   */
  search: AsyncRequestHandler;
}

/**
 * Media Controller Interface
 * Specialized for media resources
 */
export interface IMediaController extends ICRUDController, ISearchController {
  /**
   * GET /media/:id/details - Get detailed media info
   */
  getDetails: AsyncRequestHandler;

  /**
   * GET /media/trending - Get trending media
   */
  getTrending: AsyncRequestHandler;

  /**
   * GET /media/popular - Get popular media
   */
  getPopular: AsyncRequestHandler;

  /**
   * POST /media/:id/sync - Force sync from external API
   */
  syncFromExternal?: AsyncRequestHandler;
}

/**
 * Auth Controller Interface
 */
export interface IAuthController extends IController {
  /**
   * POST /auth/register - Register new user
   */
  register: AsyncRequestHandler;

  /**
   * POST /auth/login - Login user
   */
  login: AsyncRequestHandler;

  /**
   * POST /auth/logout - Logout user
   */
  logout: AsyncRequestHandler;

  /**
   * POST /auth/refresh - Refresh access token
   */
  refreshToken?: AsyncRequestHandler;

  /**
   * GET /auth/me - Get current user
   */
  getCurrentUser?: AsyncRequestHandler;
}

/**
 * Controller response helpers interface
 */
export interface IControllerHelpers {
  /**
   * Send success response
   */
  success<T>(res: Response, data: T, statusCode?: number): Response<ApiResponse<T>>;

  /**
   * Send created response (201)
   */
  created<T>(res: Response, data: T): Response<ApiResponse<T>>;

  /**
   * Send no content response (204)
   */
  noContent(res: Response): Response;

  /**
   * Send error response
   */
  error(res: Response, message: string, statusCode?: number, details?: any): Response<ApiResponse>;

  /**
   * Send paginated response
   */
  paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    }
  ): Response<PaginatedApiResponse<T>>;
}

/**
 * Controller with middleware binding support
 */
export interface IMiddlewareController extends IController {
  /**
   * Bind middleware to routes
   */
  bindMiddleware(): void;

  /**
   * Get route definitions
   */
  getRoutes(): Array<{
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    path: string;
    handler: RequestHandler;
    middlewares?: RequestHandler[];
  }>;
}
