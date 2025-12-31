const express = require('express');
const router = express.Router();
const animeController = require('./anime.controller');
const { getAnimeDetailsValidator } = require('./anime.validator');

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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     idAnilist:
 *                       type: integer
 *                       example: 1
 *                     titleRomaji:
 *                       type: string
 *                       example: "Cowboy Bebop"
 *                     titleEnglish:
 *                       type: string
 *                       nullable: true
 *                       example: "Cowboy Bebop"
 *                     titleNative:
 *                       type: string
 *                       nullable: true
 *                       example: "カウボーイビバップ"
 *                     coverImage:
 *                       type: string
 *                       nullable: true
 *                       example: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-CXtrrkMpJ8Zq.png"
 *                     bannerImage:
 *                       type: string
 *                       nullable: true
 *                       example: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1-OquNCNB6srGe.jpg"
 *                     status:
 *                       type: string
 *                       enum: [FINISHED, RELEASING, NOT_YET_RELEASED, CANCELLED, HIATUS]
 *                       example: "FINISHED"
 *                     averageScore:
 *                       type: integer
 *                       nullable: true
 *                       example: 86
 *                     description:
 *                       type: string
 *                       nullable: true
 *                       example: "In the year 2071, humanity has colonized several of the planets..."
 *                     isAdult:
 *                       type: boolean
 *                       example: false
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
 *                     source:
 *                       type: string
 *                       nullable: true
 *                       example: "ORIGINAL"
 *                     trailer:
 *                       type: string
 *                       nullable: true
 *                       example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *                     lastSyncedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-31T10:30:00.000Z"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-01T08:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-31T10:30:00.000Z"
 *                     animeMetadata:
 *                       type: object
 *                       nullable: true
 *                       description: "Additional metadata for the anime"
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
router.get('/:anilistId', getAnimeDetailsValidator, animeController.getAnimeDetail);

module.exports = router;