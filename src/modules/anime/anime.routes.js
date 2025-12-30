const express = require('express');
const router = express.Router();
const animeController = require('./anime.controller');
const { getAnimeDetailsValidator } = require('./anime.validator');

/**
 * @route GET /api/anilist/anime/:anilistId
 * @desc Get anime details by AniList ID
 * @access Public
 * @param {number} anilistId - The AniList ID of the anime
 * @returns {Object} - The anime details
 */
router.get('/:anilistId', getAnimeDetailsValidator, animeController.getAnimeDetail);

module.exports = router;