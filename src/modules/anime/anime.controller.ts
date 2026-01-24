import type { Request, Response } from 'express';
import { BaseMediaController } from '../../core/base/BaseMediaController';
import type AnimeService from './anime.service';

/**
 * Anime Controller
 *
 * HTTP request handler layer for anime endpoints.
 * Extends BaseMediaController with anime-specific route handlers.
 *
 * Features:
 * - Anime detail retrieval
 * - Overview with relations, characters, staff, stats
 * - Character and staff listing with pagination
 * - Statistics retrieval
 * - Streaming platforms (Where to Watch)
 * - Request validation and parameter extraction
 * - Standardized response formatting
 * - Error handling via BaseMediaController
 *
 * @extends BaseMediaController
 */
class AnimeController extends BaseMediaController<AnimeService> {
  /**
   * Create anime controller instance
   *
   * @param animeService - Anime service instance (injected by DI container)
   */
  constructor(animeService: AnimeService) {
    super(animeService);

    this.getBasicInfo = this.getBasicInfo.bind(this);
    this.getOverview = this.getOverview.bind(this);
    this.getCharacters = this.getCharacters.bind(this);
    this.getStaff = this.getStaff.bind(this);
    this.getStatistics = this.getStatistics.bind(this);
    this.getWhereToWatch = this.getWhereToWatch.bind(this);
  }

  // ==================== PUBLIC API ====================

  /**
   * Get streaming platforms information for anime (Where to Watch)
   *
   * @route GET /api/anime/:externalId/watch
   * @param req - Express request (expects :externalId param)
   * @param res - Express response
   * @returns Success response with streaming data
   */
  async getWhereToWatch(req: Request, res: Response): Promise<Response> {
    const externalId = this.getIntParam(req, 'externalId');
    this.logInfo('Fetching streaming platforms', { externalId });

    const streamingData = await this.service.getWhereToWatch(externalId);

    return this.success(res, streamingData);
  }
}

export default AnimeController;
