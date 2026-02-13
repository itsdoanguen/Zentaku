import type { Router } from 'express';
import express from 'express';
import MangaValidator = require('./manga.validator');

const initializeMangaRoutes = (container: any): Router => {
  const router = express.Router();

  const mangaController = container.resolve('mangaController');

  /**
   * @swagger
   * /api/anilist/manga/{anilistId}:
   *   get:
   *     summary: Get manga basic information
   *     description: Retrieve detailed information about a manga from AniList API. Data is cached in database and synced every 7 days.
   *     tags: [Manga]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the manga
   *         example: 30013
   *     responses:
   *       200:
   *         description: Manga details retrieved successfully
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
   *                     idAnilist:
   *                       type: integer
   *                       example: 30013
   *                     malId:
   *                       type: integer
   *                       example: 44489
   *                     title:
   *                       type: object
   *                       properties:
   *                         romaji:
   *                           type: string
   *                         english:
   *                           type: string
   *                         native:
   *                           type: string
   *                     coverImage:
   *                       type: string
   *                     bannerImage:
   *                       type: string
   *                     type:
   *                       type: string
   *                       example: "MANGA"
   *                     status:
   *                       type: string
   *                       example: "FINISHED"
   *                     isAdult:
   *                       type: boolean
   *                     score:
   *                       type: number
   *                     meanScore:
   *                       type: number
   *                     description:
   *                       type: string
   *                     synonyms:
   *                       type: array
   *                       items:
   *                         type: string
   *                     genres:
   *                       type: array
   *                       items:
   *                         type: string
   *                     tags:
   *                       type: array
   *                     popularity:
   *                       type: integer
   *                     favorites:
   *                       type: integer
   *                     chapters:
   *                       type: integer
   *                     volumes:
   *                       type: integer
   *                     author:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           name:
   *                             type: string
   *                           role:
   *                             type: string
   *                     serialization:
   *                       type: string
   *                     lastSyncedAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/:anilistId',
    MangaValidator.getByIdRules(),
    MangaValidator.validate,
    mangaController.getBasicInfo
  );

  /**
   * @swagger
   * /api/anilist/manga/{anilistId}/overview:
   *   get:
   *     summary: Get manga overview
   *     description: Retrieve comprehensive overview including relations, characters preview, staff preview, statistics, rankings, and recommendations
   *     tags: [Manga]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the manga
   *         example: 30013
   *     responses:
   *       200:
   *         description: Manga overview retrieved successfully
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
   *                       example: 30013
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
   *                                 example: "ADAPTATION"
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
    MangaValidator.getByIdRules(),
    MangaValidator.validate,
    mangaController.getOverview
  );

  /**
   * @swagger
   * /api/anilist/manga/{anilistId}/characters:
   *   get:
   *     summary: Get manga characters with pagination
   *     description: Retrieve paginated list of characters for a manga, including role information
   *     tags: [Manga]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the manga
   *         example: 30013
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
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/:anilistId/characters',
    MangaValidator.getByIdRules(),
    MangaValidator.validate,
    mangaController.getCharacters
  );

  /**
   * @swagger
   * /api/anilist/manga/{anilistId}/staff:
   *   get:
   *     summary: Get manga staff with pagination
   *     description: Retrieve paginated list of staff members for a manga, including their roles
   *     tags: [Manga]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the manga
   *         example: 30013
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
   *                             example: "Story & Art"
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/:anilistId/staff',
    MangaValidator.getByIdRules(),
    MangaValidator.validate,
    mangaController.getStaff
  );

  /**
   * @swagger
   * /api/anilist/manga/{anilistId}/stats:
   *   get:
   *     summary: Get manga statistics
   *     description: Retrieve comprehensive statistics including rankings, score distribution, and status distribution
   *     tags: [Manga]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the manga
   *         example: 30013
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
   *                       example: 30013
   *                     averageScore:
   *                       type: number
   *                       example: 82
   *                     meanScore:
   *                       type: number
   *                       example: 82
   *                     rankings:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           rank:
   *                             type: integer
   *                             example: 150
   *                           type:
   *                             type: string
   *                             example: "RATED"
   *                           format:
   *                             type: string
   *                             example: "MANGA"
   *                           year:
   *                             type: integer
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
   *                                 example: 80
   *                               amount:
   *                                 type: integer
   *                                 example: 5000
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
   *                                 example: 30000
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/:anilistId/stats',
    MangaValidator.getByIdRules(),
    MangaValidator.validate,
    mangaController.getStatistics
  );

  return router;
};

export = initializeMangaRoutes;
