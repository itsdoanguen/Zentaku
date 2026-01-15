import type { NextFunction, Request, Response } from 'express';
import type { ValidationChain } from 'express-validator';
import { param, validationResult } from 'express-validator';

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
  static getByIdRules(): ValidationChain[] {
    return [
      param('anilistId')
        .notEmpty()
        .withMessage('anilistId is required')
        .isInt({ min: 1 })
        .withMessage('anilistId must be a positive integer')
        .toInt(),
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
  static validate(req: Request, res: Response, next: NextFunction): Response | void {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error) => ({
        field: error.type === 'field' ? error.path : (error as any).param,
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: formattedErrors,
      });
    }

    next();
  }
}

export = AnimeValidator;
