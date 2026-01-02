const animeService = require('./anime.service');
const logger = require('../../shared/utils/logger');

class AnimeController {
  /**
   * Get anime detail by AniList ID
   * @route GET /api/anime/:anilistId
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @param {NextFunction} next - Express next middleware
   */
  async getAnimeDetail(req, res, next) {
    try {
      const { anilistId } = req.params;
      const anilistIdInt = parseInt(anilistId, 10);

      logger.info(`Fetching anime detail for ID: ${anilistIdInt}`);

      const anime = await animeService.getAnimeDetails(anilistIdInt);

      return res.status(200).json({
        success: true,
        data: anime
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = AnimeController;