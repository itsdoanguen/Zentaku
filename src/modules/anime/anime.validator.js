const { param, validationResult } = require('express-validator');

/**
 * Anime Validator
 * Validation rules for anime-related endpoints using express-validator
 */
class AnimeValidator {
  /**
   * Validation rules for getAnimeDetail endpoint
   * @route GET /api/anime/:anilistId
   * @returns {Array} Array of validation chains
   * 
   * @example
   * router.get('/:anilistId', 
   *   AnimeValidator.getByIdRules(), 
   *   AnimeValidator.validate,
   *   controller.getAnimeDetail
   * );
   */
  static getByIdRules() {
    return [
      param('anilistId')
        .notEmpty()
        .withMessage('anilistId is required')
        .isInt({ min: 1 })
        .withMessage('anilistId must be a positive integer')
        .toInt() 
    ];
  }

  /**
   * Validation middleware to check for errors
   * Execute after validation rules to handle validation results
   * 
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @param {NextFunction} next - Express next middleware
   * @returns {Response|void} Error response or proceeds to next middleware
   * 
   * @example
   * router.post('/anime',
   *   AnimeValidator.createRules(),
   *   AnimeValidator.validate,
   *   controller.create
   * );
   */
  static validate(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: formattedErrors
      });
    }
    
    next();
  }
}

module.exports = AnimeValidator;