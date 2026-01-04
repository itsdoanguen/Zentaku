const BaseController = require('../../core/base/BaseController');

/**
 * Anime Controller
 * HTTP request handler layer for anime endpoints
 * 
 * Extends BaseController with anime-specific route handlers
 * Uses dependency injection for better testability
 * 
 * @extends BaseController
 */
class AnimeController extends BaseController {
  /**
   * Constructor with dependency injection
   * @param {Object} animeService - Anime service instance
   */
  constructor(animeService) {
    super(animeService);
    
    this.getAnimeDetail = this.asyncHandler(this.getAnimeDetail);
  }
  
  /**
   * Get anime detail by AniList ID
   * @route GET /api/anime/:anilistId
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   */
  async getAnimeDetail(req, res) {
    const anilistId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching anime detail', { anilistId });
    
    const anime = await this.service.getAnimeDetails(anilistId);
    
    return this.success(res, anime);
  }
}

module.exports = AnimeController;