/**
 * Base Media Controller
 *
 * Specialized base controller for media-related endpoints (Anime, Manga, Novel).
 * This class serves as a foundation for specific media controllers,
 * providing common functionality for media operations.
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
   * @param req - Express request (expects :externalId param)
   * @param res - Express response
   * @returns Success response with media data
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

  // Get media overview data
  async getOverview(req: Request, res: Response): Promise<Response> {
    const externalId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching media overview', { externalId });

    const overview = await this.service.getOverview(externalId);

    return this.success(res, overview);
  }

  // Get characters for media with pagination
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

  // Get staff for media with pagination
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

  // Get statistics for media
  async getStatistics(req: Request, res: Response): Promise<Response> {
    const externalId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching media statistics', { externalId });

    const statistics = await this.service.getStatistics(externalId);

    return this.success(res, statistics);
  }
}

export default BaseMediaController;
