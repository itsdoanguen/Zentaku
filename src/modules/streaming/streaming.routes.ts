import { Router } from 'express';
import {
  validateGetEpisodeSources,
  validateGetEpisodes,
  validateSyncHianimeId,
} from './streaming.validator';

/**
 * Create streaming routes with dependency injection
 *
 * @param container - DI container instance
 * @returns Express router
 */
const createStreamingRoutes = (container: unknown): Router => {
  const router = Router();
  const controller = (container as any).resolve('streamingController');

  /**
   * @route   GET /streaming/:anilistId/episodes/:episodeNumber/sources
   * @desc    Get streaming sources for a specific episode
   * @access  Public
   * @query   server - Streaming server (hd-1, hd-2, meg-1, meg-2)
   * @query   category - Audio category (sub, dub, raw)
   *
   * @example /streaming/21/episodes/1/sources?server=hd-1&category=sub
   */
  router.get(
    '/:anilistId/episodes/:episodeNumber/sources',
    validateGetEpisodeSources,
    controller.getEpisodeSources
  );

  /**
   * @route   GET /streaming/:anilistId/episodes
   * @desc    Get all available episodes for an anime
   * @access  Public
   *
   * @example /streaming/21/episodes
   */
  router.get('/:anilistId/episodes', validateGetEpisodes, controller.getEpisodes);

  /**
   * @route   POST /streaming/:anilistId/sync
   * @desc    Manually trigger HiAnime ID sync
   * @access  Public
   *
   * @example /streaming/21/sync
   */
  router.post('/:anilistId/sync', validateSyncHianimeId, controller.syncHianimeId);

  return router;
};

export = createStreamingRoutes;
