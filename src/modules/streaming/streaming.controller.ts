/**
 * Streaming Controller
 *
 * HTTP controller for streaming endpoints.
 * Inherits from BaseController for response helpers and error handling.
 *
 * @extends BaseController
 */

import type { Request, Response } from 'express';
import { BaseController } from '../../core/base/BaseController';
import type StreamingService from './streaming.service';

class StreamingController extends BaseController<StreamingService> {
  constructor(service: StreamingService) {
    super(service);
    this.logger.info('[StreamingController] Initialized');
  }

  /**
   * GET /streaming/:anilistId/episodes/:episodeNumber/sources
   * Get streaming sources for a specific episode
   *
   * @param req - Express request
   * @param res - Express response
   */
  getEpisodeSources = this.asyncHandler(async (req: Request, res: Response) => {
    const anilistId = this.getIntParam(req, 'anilistId');
    const episodeNumber = this.getIntParam(req, 'episodeNumber');
    const server = req.query.server as string | undefined;
    const category = req.query.category as 'sub' | 'dub' | 'raw' | undefined;

    this.logInfo('Fetching episode sources', {
      anilistId,
      episodeNumber,
      server,
      category,
    });

    const sources = await this.service.getEpisodeSources(
      anilistId,
      episodeNumber,
      server,
      category
    );

    return this.success(res, sources);
  });

  /**
   * GET /streaming/:anilistId/episodes
   * Get all available episodes for an anime
   *
   * @param req - Express request
   * @param res - Express response
   */
  getEpisodes = this.asyncHandler(async (req: Request, res: Response) => {
    const anilistId = this.getIntParam(req, 'anilistId');

    this.logInfo('Fetching available episodes', { anilistId });

    const episodes = await this.service.getAvailableEpisodes(anilistId);

    return this.success(res, episodes);
  });

  /**
   * POST /streaming/:anilistId/sync
   * Manually trigger HiAnime ID sync
   *
   * @param req - Express request
   * @param res - Express response
   */
  syncHianimeId = this.asyncHandler(async (req: Request, res: Response) => {
    const anilistId = this.getIntParam(req, 'anilistId');

    this.logInfo('Syncing HiAnime ID', { anilistId });

    const syncResult = await this.service.syncHianimeId(anilistId);

    return this.success(res, syncResult, 200);
  });
}

export default StreamingController;
