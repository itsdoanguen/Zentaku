import type { Router } from 'express';
import express from 'express';
import AnimeValidator = require('./anime.validator');

/**
 * Initialize anime routes with dependency injection
 * @param {Object} container - DI container instance
 * @returns {Router} Express router with configured routes
 */
const initializeAnimeRoutes = (container: any): Router => {
  const router = express.Router();

  const animeController = container.resolve('animeController');

  /**
   * @swagger
   * /api/anilist/anime/{anilistId}:
   *   get:
   *     summary: Get anime basic information
   *     description: Retrieve detailed information about an anime from AniList API. Data is cached in database and synced every 7 days.
   *     tags: [Anime]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the anime
   *         example: 1
   *     responses:
   *       200:
   *         description: Anime details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AnimeResponse'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/:anilistId',
    AnimeValidator.getByIdRules(),
    AnimeValidator.validate,
    animeController.getBasicInfo
  );

  /**
   * @swagger
   * /api/anilist/anime/{anilistId}/overview:
   *   get:
   *     summary: Get anime overview
   *     description: Retrieve comprehensive overview including relations, characters preview, staff preview, statistics, rankings, and recommendations
   *     tags: [Anime]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the anime
   *         example: 1
   *     responses:
   *       200:
   *         description: Anime overview retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     relations:
   *                       type: object
   *                       properties:
   *                         edges:
   *                           type: array
   *                           items:
   *                             type: object
   *                             properties:
   *                               id:
   *                                 type: integer
   *                               relationType:
   *                                 type: string
   *                                 example: "SEQUEL"
   *                               node:
   *                                 type: object
   *                     characters:
   *                       type: object
   *                       description: "Preview of first 6 characters"
   *                       properties:
   *                         edges:
   *                           type: array
   *                           items:
   *                             type: object
   *                         pageInfo:
   *                           $ref: '#/components/schemas/PageInfo'
   *                     staff:
   *                       type: object
   *                       description: "Preview of first 6 staff members"
   *                       properties:
   *                         edges:
   *                           type: array
   *                         pageInfo:
   *                           $ref: '#/components/schemas/PageInfo'
   *                     stats:
   *                       type: object
   *                       properties:
   *                         scoreDistribution:
   *                           type: array
   *                           items:
   *                             type: object
   *                         statusDistribution:
   *                           type: array
   *                           items:
   *                             type: object
   *                     rankings:
   *                       type: array
   *                       items:
   *                         type: object
   *                     recommendations:
   *                       type: object
   *                       description: "Preview of first 6 recommendations"
   *                       properties:
   *                         edges:
   *                           type: array
   *                         pageInfo:
   *                           $ref: '#/components/schemas/PageInfo'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/:anilistId/overview',
    AnimeValidator.getByIdRules(),
    AnimeValidator.validate,
    animeController.getOverview
  );

  /**
   * @swagger
   * /api/anilist/anime/{anilistId}/characters:
   *   get:
   *     summary: Get anime characters with pagination
   *     description: Retrieve paginated list of characters for an anime, including role information and voice actors
   *     tags: [Anime]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the anime
   *         example: 1
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *         example: 1
   *       - in: query
   *         name: perPage
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 25
   *         description: Number of items per page (max 50)
   *         example: 25
   *     responses:
   *       200:
   *         description: Characters retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     pageInfo:
   *                       $ref: '#/components/schemas/PageInfo'
   *                     edges:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           node:
   *                             type: object
   *                             properties:
   *                               id:
   *                                 type: integer
   *                               name:
   *                                 type: object
   *                                 properties:
   *                                   full:
   *                                     type: string
   *                                   native:
   *                                     type: string
   *                               image:
   *                                 type: object
   *                                 properties:
   *                                   large:
   *                                     type: string
   *                           role:
   *                             type: string
   *                             example: "MAIN"
   *                           voiceActors:
   *                             type: array
   *                             items:
   *                               type: object
   *                               properties:
   *                                 id:
   *                                   type: integer
   *                                 name:
   *                                   type: object
   *                                 language:
   *                                   type: string
   *                                   example: "Japanese"
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/:anilistId/characters',
    AnimeValidator.getByIdRules(),
    AnimeValidator.validate,
    animeController.getCharacters
  );

  /**
   * @swagger
   * /api/anilist/anime/{anilistId}/staff:
   *   get:
   *     summary: Get anime staff with pagination
   *     description: Retrieve paginated list of staff members for an anime, including their roles
   *     tags: [Anime]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the anime
   *         example: 1
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *         example: 1
   *       - in: query
   *         name: perPage
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 25
   *         description: Number of items per page (max 50)
   *         example: 25
   *     responses:
   *       200:
   *         description: Staff retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     pageInfo:
   *                       $ref: '#/components/schemas/PageInfo'
   *                     edges:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           node:
   *                             type: object
   *                             properties:
   *                               id:
   *                                 type: integer
   *                               name:
   *                                 type: object
   *                                 properties:
   *                                   full:
   *                                     type: string
   *                                   native:
   *                                     type: string
   *                               image:
   *                                 type: object
   *                           role:
   *                             type: string
   *                             example: "Director"
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/:anilistId/staff',
    AnimeValidator.getByIdRules(),
    AnimeValidator.validate,
    animeController.getStaff
  );

  /**
   * @swagger
   * /api/anilist/anime/{anilistId}/stats:
   *   get:
   *     summary: Get anime statistics
   *     description: Retrieve comprehensive statistics including rankings, score distribution, and status distribution
   *     tags: [Anime]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the anime
   *         example: 1
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     averageScore:
   *                       type: number
   *                       example: 86
   *                     meanScore:
   *                       type: number
   *                       example: 86
   *                     rankings:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           rank:
   *                             type: integer
   *                             example: 28
   *                           type:
   *                             type: string
   *                             example: "RATED"
   *                           format:
   *                             type: string
   *                             example: "TV"
   *                           year:
   *                             type: integer
   *                           season:
   *                             type: string
   *                             example: "SPRING"
   *                           allTime:
   *                             type: boolean
   *                           context:
   *                             type: string
   *                             example: "highest rated all time"
   *                     stats:
   *                       type: object
   *                       properties:
   *                         scoreDistribution:
   *                           type: array
   *                           items:
   *                             type: object
   *                             properties:
   *                               score:
   *                                 type: integer
   *                                 example: 90
   *                               amount:
   *                                 type: integer
   *                                 example: 15000
   *                         statusDistribution:
   *                           type: array
   *                           items:
   *                             type: object
   *                             properties:
   *                               status:
   *                                 type: string
   *                                 example: "COMPLETED"
   *                               amount:
   *                                 type: integer
   *                                 example: 100000
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/:anilistId/stats',
    AnimeValidator.getByIdRules(),
    AnimeValidator.validate,
    animeController.getStatistics
  );

  /**
   * @swagger
   * /api/anilist/anime/{anilistId}/watch:
   *   get:
   *     summary: Get streaming platforms for anime (Where to Watch)
   *     description: Retrieve list of legal streaming platforms where the anime can be watched. Anime-specific feature.
   *     tags: [Anime]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the anime
   *         example: 1
   *     responses:
   *       200:
   *         description: Streaming platforms retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       title:
   *                         type: string
   *                         example: "Episode 1 - Asteroid Blues"
   *                         description: "Episode title"
   *                       url:
   *                         type: string
   *                         format: uri
   *                         example: "https://www.crunchyroll.com/cowboy-bebop/episode-1"
   *                         description: "Direct link to watch the episode"
   *                       site:
   *                         type: string
   *                         example: "Crunchyroll"
   *                         description: "Streaming platform name"
   *                   example:
   *                     - title: "Episode 1 - Asteroid Blues"
   *                       url: "https://www.crunchyroll.com/cowboy-bebop/episode-1"
   *                       site: "Crunchyroll"
   *                     - title: "Episode 2 - Stray Dog Strut"
   *                       url: "https://www.crunchyroll.com/cowboy-bebop/episode-2"
   *                       site: "Crunchyroll"
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/:anilistId/watch',
    AnimeValidator.getByIdRules(),
    AnimeValidator.validate,
    animeController.getWhereToWatch
  );

  return router;
};

export = initializeAnimeRoutes;
