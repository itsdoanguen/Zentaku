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
   *                   required:
   *                     - idAnilist
   *                     - title
   *                     - type
   *                     - status
   *                     - isAdult
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
   *                       required:
   *                         - romaji
   *                       properties:
   *                         romaji:
   *                           type: string
   *                           example: "Cowboy Bebop"
   *                           description: "Romaji title (always present)"
   *                         english:
   *                           type: string
   *                           nullable: true
   *                           example: "Cowboy Bebop"
   *                           description: "English title"
   *                         native:
   *                           type: string
   *                           nullable: true
   *                           example: "カウボーイビバップ"
   *                           description: "Native title (Japanese)"
   *                     coverImage:
   *                       type: string
   *                       nullable: true
   *                       example: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png"
   *                       description: "Cover/poster image URL"
   *                     bannerImage:
   *                       type: string
   *                       nullable: true
   *                       example: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1-OquNCNB6srGe.jpg"
   *                       description: "Banner image URL"
   *                     type:
   *                       type: string
   *                       enum: [ANIME]
   *                       example: "ANIME"
   *                       description: "Media type (always ANIME for this endpoint)"
   *                     status:
   *                       type: string
   *                       enum: [RELEASING, FINISHED, NOT_YET_RELEASED, CANCELLED]
   *                       example: "FINISHED"
   *                       description: "Release status"
   *                     isAdult:
   *                       type: boolean
   *                       example: false
   *                       description: "Adult content flag"
   *                     score:
   *                       type: number
   *                       format: float
   *                       nullable: true
   *                       minimum: 0
   *                       maximum: 10
   *                       example: 8.6
   *                       description: "Average score (0-10 scale, normalized from AniList)"
   *                     meanScore:
   *                       type: number
   *                       format: float
   *                       nullable: true
   *                       minimum: 0
   *                       maximum: 10
   *                       example: 8.6
   *                       description: "Mean score (0-10 scale, normalized from AniList)"
   *                     description:
   *                       type: string
   *                       nullable: true
   *                       example: "In the year 2071, humanity has colonized several of the planets..."
   *                       description: "Anime synopsis/description (HTML tags cleaned)"
   *                     synonyms:
   *                       type: array
   *                       nullable: true
   *                       items:
   *                         type: string
   *                       example: ["Cowboy Bebop"]
   *                       description: "Alternative titles"
   *                     genres:
   *                       type: array
   *                       nullable: true
   *                       items:
   *                         type: string
   *                       example: ["Action", "Adventure", "Drama", "Sci-Fi"]
   *                       description: "Genre tags"
   *                     tags:
   *                       type: array
   *                       nullable: true
   *                       items:
   *                         type: object
   *                         properties:
   *                           name:
   *                             type: string
   *                           rank:
   *                             type: integer
   *                       example: [{"name": "Space", "rank": 95}, {"name": "Episodic", "rank": 90}]
   *                       description: "Detailed tags from AniList"
   *                     popularity:
   *                       type: integer
   *                       nullable: true
   *                       example: 150000
   *                       description: "Number of users who added this anime"
   *                     favorites:
   *                       type: integer
   *                       nullable: true
   *                       example: 50000
   *                       description: "Number of users who favorited this anime"
   *                     episodes:
   *                       type: integer
   *                       nullable: true
   *                       example: 26
   *                       description: "Total number of episodes"
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
   *                       description: "Season of initial release"
   *                     seasonYear:
   *                       type: integer
   *                       nullable: true
   *                       example: 1998
   *                       description: "Year of initial release"
   *                     studio:
   *                       type: string
   *                       nullable: true
   *                       example: "Sunrise"
   *                       description: "Primary animation studio"
   *                     source:
   *                       type: string
   *                       nullable: true
   *                       example: "ORIGINAL"
   *                       description: "Source material (ORIGINAL, MANGA, LIGHT_NOVEL, etc.)"
   *                     trailerUrl:
   *                       type: string
   *                       nullable: true
   *                       format: uri
   *                       example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   *                       description: "Complete trailer URL (YouTube or Dailymotion)"
   *                     nextAiringEpisode:
   *                       type: object
   *                       nullable: true
   *                       properties:
   *                         airingAt:
   *                           type: integer
   *                           description: "Unix timestamp of next episode air time"
   *                         timeUntilAiring:
   *                           type: integer
   *                           description: "Seconds until next episode airs"
   *                         episode:
   *                           type: integer
   *                           description: "Next episode number"
   *                       example:
   *                         airingAt: 1735646400
   *                         timeUntilAiring: 86400
   *                         episode: 13
   *                       description: "Information about next airing episode (for ongoing anime)"
   *                     lastSyncedAt:
   *                       type: string
   *                       nullable: true
   *                       format: date-time
   *                       example: "2025-12-31T10:30:00.000Z"
   *                       description: "Last time data was synced from AniList (ISO 8601 format)"
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
