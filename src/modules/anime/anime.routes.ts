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

  // Resolve controller from DI container
  const animeController = container.resolve('animeController');

  /**
   * @swagger
   * /api/anilist/anime/{anilistId}:
   *   get:
   *     summary: Get anime details by AniList ID
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
   *                       example: 1
   *                       description: "AniList ID of the anime"
   *                     malId:
   *                       type: integer
   *                       nullable: true
   *                       example: 1
   *                       description: "MyAnimeList ID"
   *                     title:
   *                       type: object
   *                       properties:
   *                         romaji:
   *                           type: string
   *                           example: "Cowboy Bebop"
   *                         english:
   *                           type: string
   *                           nullable: true
   *                           example: "Cowboy Bebop"
   *                         native:
   *                           type: string
   *                           nullable: true
   *                           example: "カウボーイビバップ"
   *                     coverImage:
   *                       type: string
   *                       nullable: true
   *                       example: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png"
   *                     bannerImage:
   *                       type: string
   *                       nullable: true
   *                       example: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1-OquNCNB6srGe.jpg"
   *                     type:
   *                       type: string
   *                       example: "ANIME"
   *                       description: "Media type"
   *                     status:
   *                       type: string
   *                       enum: [FINISHED, RELEASING, NOT_YET_RELEASED, CANCELLED]
   *                       example: "FINISHED"
   *                     isAdult:
   *                       type: boolean
   *                       example: false
   *                     score:
   *                       type: number
   *                       nullable: true
   *                       example: 8.6
   *                       description: "Average score (0-10 scale)"
   *                     meanScore:
   *                       type: number
   *                       nullable: true
   *                       example: 8.6
   *                       description: "Mean score (0-10 scale)"
   *                     description:
   *                       type: string
   *                       nullable: true
   *                       example: "In the year 2071, humanity has colonized several of the planets..."
   *                     synonyms:
   *                       type: array
   *                       nullable: true
   *                       items:
   *                         type: string
   *                       example: ["Cowboy Bebop"]
   *                     genres:
   *                       type: array
   *                       nullable: true
   *                       items:
   *                         type: string
   *                       example: ["Action", "Adventure", "Drama", "Sci-Fi"]
   *                     tags:
   *                       type: array
   *                       nullable: true
   *                       items:
   *                         type: object
   *                       description: "Array of tag objects from AniList"
   *                     popularity:
   *                       type: integer
   *                       nullable: true
   *                       example: 150000
   *                     favorites:
   *                       type: integer
   *                       nullable: true
   *                       example: 50000
   *                     episodes:
   *                       type: integer
   *                       nullable: true
   *                       example: 26
   *                     duration:
   *                       type: integer
   *                       nullable: true
   *                       example: 24
   *                       description: "Episode duration in minutes"
   *                     season:
   *                       type: string
   *                       nullable: true
   *                       enum: [WINTER, SPRING, SUMMER, FALL]
   *                       example: "SPRING"
   *                     seasonYear:
   *                       type: integer
   *                       nullable: true
   *                       example: 1998
   *                     studio:
   *                       type: string
   *                       nullable: true
   *                       example: "Sunrise"
   *                       description: "Primary studio name"
   *                     source:
   *                       type: string
   *                       nullable: true
   *                       example: "ORIGINAL"
   *                     trailerUrl:
   *                       type: string
   *                       nullable: true
   *                       example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   *                       description: "Complete trailer URL (YouTube or Dailymotion)"
   *                     nextAiringEpisode:
   *                       type: object
   *                       nullable: true
   *                       description: "Information about the next airing episode"
   *                     lastSyncedAt:
   *                       type: string
   *                       nullable: true
   *                       format: date-time
   *                       example: "2025-12-31T10:30:00.000Z"
   *                       description: "Last time data was synced from AniList"
   *       400:
   *         description: Invalid anime ID format or validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       404:
   *         description: Anime not found on AniList
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 name: "NotFoundError"
   *                 message: "Anime with ID 999999999 not found"
   *       500:
   *         description: Internal server error or AniList API error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               success: false
   *               error:
   *                 name: "AnilistAPIError"
   *                 message: "Failed to fetch data from AniList API"
   */
  router.get(
    '/:anilistId',
    AnimeValidator.getByIdRules(),
    AnimeValidator.validate,
    animeController.getAnimeDetail
  );

  return router;
};

export = initializeAnimeRoutes;
