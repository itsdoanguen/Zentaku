/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Router } from 'express';
import express from 'express';
import ReadingMediaValidator = require('./reading-media.validator');

/**
 * Initialize reading media routes with dependency injection
 * Handles both Manga and Novel endpoints with format-based filtering
 *
 * @param {Object} container - DI container instance
 * @returns {Router} Express router with configured routes
 */
const initializeReadingMediaRoutes = (container: any): Router => {
  const router = express.Router();

  const readingMediaController = container.resolve('readingMediaController');

  // ============================================
  // MANGA ENDPOINTS
  // Format: MANGA, ONE_SHOT
  // ============================================

  /**
   * @swagger
   * /api/anilist/manga/search:
   *   get:
   *     summary: Search manga
   *     description: Search for manga (includes manhwa, manhua, one-shots). Manhwa/Manhua are identified by countryOfOrigin field (KR/CN/TW).
   *     tags: [Manga]
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         description: Search query (alternative to 'query' parameter)
   *         example: "One Piece"
   *       - in: query
   *         name: query
   *         schema:
   *           type: string
   *         description: Search query (alternative to 'q' parameter)
   *         example: "One Piece"
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: perPage
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 20
   *         description: Number of items per page (max 50)
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
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
   *                     media:
   *                       type: array
   *                       items:
   *                         type: object
   *                     pageInfo:
   *                       $ref: '#/components/schemas/PageInfo'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/manga/search',
    ReadingMediaValidator.searchRules(),
    ReadingMediaValidator.validate,
    readingMediaController.searchManga
  );

  /**
   * @swagger
   * /api/anilist/manga/{anilistId}:
   *   get:
   *     summary: Get manga basic information
   *     description: Retrieve detailed information about a manga from AniList API. Data is cached in database and synced every 7 days. Includes manhwa (KR), manhua (CN/TW), and one-shots.
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
   *                     format:
   *                       type: string
   *                       enum: [MANGA, ONE_SHOT]
   *                       example: "MANGA"
   *                     mediaCategory:
   *                       type: string
   *                       enum: [manga, novel]
   *                       example: "manga"
   *                     chapters:
   *                       type: integer
   *                       nullable: true
   *                     volumes:
   *                       type: integer
   *                       nullable: true
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/manga/:anilistId',
    ReadingMediaValidator.getByIdRules(),
    ReadingMediaValidator.validate,
    readingMediaController.getMangaBasicInfo
  );

  /**
   * @swagger
   * /api/anilist/manga/{anilistId}/overview:
   *   get:
   *     summary: Get manga overview
   *     description: Retrieve comprehensive overview including relations, characters preview, staff preview, statistics, and rankings
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
   *                     relations:
   *                       type: object
   *                     characters:
   *                       type: object
   *                       description: "Preview of first 6 characters"
   *                     staff:
   *                       type: object
   *                       description: "Preview of first 6 staff members"
   *                     stats:
   *                       type: object
   *                     rankings:
   *                       type: array
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/manga/:anilistId/overview',
    ReadingMediaValidator.getByIdRules(),
    ReadingMediaValidator.validate,
    readingMediaController.getMangaOverview
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
   *       - in: query
   *         name: perPage
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 25
   *         description: Number of items per page (max 50)
   *     responses:
   *       200:
   *         description: Characters retrieved successfully
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/manga/:anilistId/characters',
    ReadingMediaValidator.getCharactersRules(),
    ReadingMediaValidator.validate,
    readingMediaController.getMangaCharacters
  );

  /**
   * @swagger
   * /api/anilist/manga/{anilistId}/staff:
   *   get:
   *     summary: Get manga staff with pagination
   *     description: Retrieve paginated list of staff members for a manga (authors, artists, etc.)
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
   *       - in: query
   *         name: perPage
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 25
   *         description: Number of items per page (max 50)
   *     responses:
   *       200:
   *         description: Staff retrieved successfully
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/manga/:anilistId/staff',
    ReadingMediaValidator.getStaffRules(),
    ReadingMediaValidator.validate,
    readingMediaController.getMangaStaff
  );

  /**
   * @swagger
   * /api/anilist/manga/{anilistId}/statistics:
   *   get:
   *     summary: Get manga statistics
   *     description: Retrieve detailed statistics including rankings, score distribution, and status distribution
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
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/manga/:anilistId/statistics',
    ReadingMediaValidator.getByIdRules(),
    ReadingMediaValidator.validate,
    readingMediaController.getMangaStatistics
  );

  // ============================================
  // NOVEL ENDPOINTS
  // Format filter: NOVEL
  // ============================================

  /**
   * @swagger
   * /api/anilist/novel/search:
   *   get:
   *     summary: Search novels
   *     description: Search for novels (includes light novels, web novels, etc.)
   *     tags: [Novel]
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         description: Search query (alternative to 'query' parameter)
   *         example: "Classroom of the Elite"
   *       - in: query
   *         name: query
   *         schema:
   *           type: string
   *         description: Search query (alternative to 'q' parameter)
   *         example: "Classroom of the Elite"
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: perPage
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 20
   *         description: Number of items per page (max 50)
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
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
   *                     media:
   *                       type: array
   *                       items:
   *                         type: object
   *                     pageInfo:
   *                       $ref: '#/components/schemas/PageInfo'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/novel/search',
    ReadingMediaValidator.searchRules(),
    ReadingMediaValidator.validate,
    readingMediaController.searchNovels
  );

  /**
   * @swagger
   * /api/anilist/novel/{anilistId}:
   *   get:
   *     summary: Get novel basic information
   *     description: Retrieve detailed information about a novel from AniList API. Data is cached in database and synced every 7 days. Includes light novels, web novels, etc.
   *     tags: [Novel]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the novel
   *         example: 104970
   *     responses:
   *       200:
   *         description: Novel details retrieved successfully
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
   *                       example: 104970
   *                     format:
   *                       type: string
   *                       enum: [NOVEL]
   *                       example: "NOVEL"
   *                     mediaCategory:
   *                       type: string
   *                       enum: [manga, novel]
   *                       example: "novel"
   *                     chapters:
   *                       type: integer
   *                       nullable: true
   *                     volumes:
   *                       type: integer
   *                       nullable: true
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/novel/:anilistId',
    ReadingMediaValidator.getByIdRules(),
    ReadingMediaValidator.validate,
    readingMediaController.getNovelBasicInfo
  );

  /**
   * @swagger
   * /api/anilist/novel/{anilistId}/overview:
   *   get:
   *     summary: Get novel overview
   *     description: Retrieve comprehensive overview including relations, characters preview, staff preview, statistics, and rankings
   *     tags: [Novel]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the novel
   *         example: 104970
   *     responses:
   *       200:
   *         description: Novel overview retrieved successfully
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/novel/:anilistId/overview',
    ReadingMediaValidator.getByIdRules(),
    ReadingMediaValidator.validate,
    readingMediaController.getNovelOverview
  );

  /**
   * @swagger
   * /api/anilist/novel/{anilistId}/characters:
   *   get:
   *     summary: Get novel characters with pagination
   *     description: Retrieve paginated list of characters for a novel, including role information
   *     tags: [Novel]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the novel
   *         example: 104970
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: perPage
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 25
   *         description: Number of items per page (max 50)
   *     responses:
   *       200:
   *         description: Characters retrieved successfully
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/novel/:anilistId/characters',
    ReadingMediaValidator.getCharactersRules(),
    ReadingMediaValidator.validate,
    readingMediaController.getNovelCharacters
  );

  /**
   * @swagger
   * /api/anilist/novel/{anilistId}/staff:
   *   get:
   *     summary: Get novel staff with pagination
   *     description: Retrieve paginated list of staff members for a novel (authors, illustrators, etc.)
   *     tags: [Novel]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the novel
   *         example: 104970
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: perPage
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 25
   *         description: Number of items per page (max 50)
   *     responses:
   *       200:
   *         description: Staff retrieved successfully
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/novel/:anilistId/staff',
    ReadingMediaValidator.getStaffRules(),
    ReadingMediaValidator.validate,
    readingMediaController.getNovelStaff
  );

  /**
   * @swagger
   * /api/anilist/novel/{anilistId}/statistics:
   *   get:
   *     summary: Get novel statistics
   *     description: Retrieve detailed statistics including rankings, score distribution, and status distribution
   *     tags: [Novel]
   *     parameters:
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: The AniList ID of the novel
   *         example: 104970
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/ServerError'
   */
  router.get(
    '/novel/:anilistId/statistics',
    ReadingMediaValidator.getByIdRules(),
    ReadingMediaValidator.validate,
    readingMediaController.getNovelStatistics
  );

  return router;
};

export = initializeReadingMediaRoutes;
