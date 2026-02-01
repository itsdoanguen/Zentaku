/**
 * Base Media Controller
 *
 * Specialized base controller for media-related endpoints (Anime, Manga, Novel).
 * This class serves as a foundation for specific media controllers,
 * providing common functionality for media operations.
 *
 * Features:
 * - Basic media information retrieval
 * - Overview data with relations, characters, staff, stats
 * - Character and staff listing with pagination
 * - Statistics retrieval
 * - Standardized response formatting
 * - Request validation and error handling
 *
 * Subclasses should:
 * - Bind route handlers in constructor
 * - Implement media-specific endpoints as needed
 * - Override methods for custom behavior
 *
 * @abstract
 * @extends BaseController
 */

import type { Request, Response } from 'express';
import { BaseController } from './BaseController';
import type { BaseMediaService } from './BaseMediaService';

/**
 * Base Media Controller Abstract Class
 */
export abstract class BaseMediaController<
  TService extends BaseMediaService = BaseMediaService,
> extends BaseController<TService> {
  protected override readonly service: TService;

  /**
   * Create a base media controller instance
   *
   * @param service - Media service instance (AnimeService, MangaService, etc.)
   * @throws {Error} If trying to instantiate abstract class directly
   */
  constructor(service: TService) {
    super(service);

    if (new.target === BaseMediaController) {
      throw new Error('Cannot instantiate abstract class BaseMediaController directly');
    }

    this.service = service;
  }

  /**
   * Get basic media information
   *
   * Retrieves complete media information including metadata.
   * Automatically syncs from external API if cache is stale.
   *
   * @param req - Express request (expects :externalId param)
   * @param res - Express response
   * @returns Success response with media data
   * @throws {ValidationError} If externalId is invalid
   * @throws {NotFoundError} If media not found
   *
   * @example
   * GET /api/anime/:externalId
   */
  async getBasicInfo(req: Request, res: Response): Promise<Response> {
    const externalId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching media details', { externalId });

    const media = await this.service.getDetails(externalId);

    return this.success(res, media);
  }

  /**
   * Get media overview data
   *
   * Retrieves comprehensive overview
   *
   * @param req - Express request (expects :externalId param)
   * @param res - Express response
   * @returns Success response with overview data
   * @throws {ValidationError} If externalId is invalid
   * @throws {NotFoundError} If media not found
   *
   * @example
   * GET /api/anime/:externalId/overview
   */
  async getOverview(req: Request, res: Response): Promise<Response> {
    const externalId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching media overview', { externalId });

    const overview = await this.service.getOverview(externalId);

    return this.success(res, overview);
  }

  /**
   * Get characters for media with pagination
   *
   * Retrieves character list with role information and voice actors.
   * Supports pagination for large character lists.
   *
   * @param req - Express request (expects :externalId param, optional ?page, ?perPage query)
   * @param res - Express response
   * @returns Success response with characters data and pagination
   * @throws {ValidationError} If parameters are invalid
   * @throws {NotFoundError} If media not found or character client unavailable
   *
   * @example
   * GET /api/anime/:externalId/characters?page=1&perPage=25
   */
  async getCharacters(req: Request, res: Response): Promise<Response> {
    const externalId = this.getIntParam(req, 'anilistId');
    const { page, perPage } = this.getPaginationParams(req, {
      page: 1,
      perPage: 25,
      maxPerPage: 50,
    });

    this.logInfo('Fetching media characters', { externalId, page, perPage });

    const characters = await this.service.getCharacters(externalId, page, perPage);

    return this.success(res, characters);
  }

  /**
   * Get staff for media with pagination
   *
   * Retrieves staff list with role information.
   * Supports pagination for large staff lists.
   *
   * @param req - Express request (expects :externalId param, optional ?page, ?perPage query)
   * @param res - Express response
   * @returns Success response with staff data and pagination
   * @throws {ValidationError} If parameters are invalid
   * @throws {NotFoundError} If media not found or staff client unavailable
   *
   * @example
   * GET /api/anime/:externalId/staff?page=1&perPage=25
   */
  async getStaff(req: Request, res: Response): Promise<Response> {
    const externalId = this.getIntParam(req, 'anilistId');
    const { page, perPage } = this.getPaginationParams(req, {
      page: 1,
      perPage: 25,
      maxPerPage: 50,
    });

    this.logInfo('Fetching media staff', { externalId, page, perPage });

    const staff = await this.service.getStaff(externalId, page, perPage);

    return this.success(res, staff);
  }

  /**
   * Get statistics for media
   *
   * Retrieves comprehensive statistics including:
   * - Average score and mean score
   * - Rankings (all-time, seasonal, format-specific)
   * - Score distribution (0-100)
   * - Status distribution (watching, completed, etc.)
   *
   * @param req - Express request (expects :externalId param)
   * @param res - Express response
   * @returns Success response with statistics data
   * @throws {ValidationError} If externalId is invalid
   * @throws {NotFoundError} If media not found
   *
   * @example
   * GET /api/anime/:externalId/statistics
   */
  async getStatistics(req: Request, res: Response): Promise<Response> {
    const externalId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching media statistics', { externalId });

    const statistics = await this.service.getStatistics(externalId);

    return this.success(res, statistics);
  }
}

export default BaseMediaController;
