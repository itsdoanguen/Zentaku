import type { Request, Response } from 'express';
import { BaseController } from '../../core/base/BaseController';
import type AnimeService from './anime.service';

/**
 * Anime Controller
 *
 * HTTP request handler layer for anime endpoints.
 * Extends BaseController with anime-specific route handlers.
 *
 * Features:
 * - Anime detail retrieval
 * - Request validation and parameter extraction
 * - Standardized response formatting
 * - Error handling via BaseController
 *
 * @extends BaseController
 */
class AnimeController extends BaseController {
  protected override readonly service: AnimeService;

  /**
   * Create anime controller instance
   *
   * @param animeService - Anime service instance (injected by DI container)
   */
  constructor(animeService: AnimeService) {
    super(animeService);

    this.service = animeService;
  }

  // ==================== PUBLIC API ====================

  /**
   * Get anime detail by AniList ID
   *
   * Retrieves complete anime information including metadata.
   * Automatically syncs from AniList if cache is stale.
   *
   * @route GET /api/anime/:anilistId
   * @param req - Express request
   * @param res - Express response
   * @returns Success response with anime data
   * @throws {ValidationError} If anilistId is invalid
   * @throws {NotFoundError} If anime not found
   *
   * @example
   * GET /api/anime/1
   * Response: {
   *   success: true,
   *   data: {
   *     idAnilist: 1,
   *     title: { romaji: "Cowboy Bebop", ... },
   *     ...
   *   }
   * }
   */
  async getAnimeDetail(req: Request, res: Response): Promise<Response> {
    const anilistId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching anime detail', { anilistId });

    const anime = await this.service.getAnimeDetails(anilistId);

    return this.success(res, anime);
  }
}

export default AnimeController;
