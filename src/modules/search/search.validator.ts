import type { NextFunction, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';

class SearchValidator {
  /**
   * Validation rules for global search
   */
  static globalSearchRules() {
    return [
      query('q')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Query must be between 2 and 100 characters'),
      query('types')
        .optional()
        .isString()
        .custom((value) => {
          const validTypes = ['anime', 'manga', 'novel', 'character', 'staff', 'all'];
          const types = value.split(',').map((t: string) => t.trim());
          return types.every((t: string) => validTypes.includes(t));
        })
        .withMessage(
          'Invalid types. Must be comma-separated: anime, manga, novel, character, staff, all'
        ),
      query('page')
        .optional()
        .isInt({ min: 1 })
        .toInt()
        .withMessage('Page must be a positive integer'),
      query('perPage')
        .optional()
        .isInt({ min: 1, max: 50 })
        .toInt()
        .withMessage('perPage must be between 1 and 50'),
    ];
  }

  /**
   * Validation rules for anime search
   */
  static animeSearchRules() {
    return [
      query('q').optional().trim().isLength({ min: 2, max: 100 }),
      query('genres')
        .optional()
        .isString()
        .custom((value) => {
          const genres = value.split(',').map((g: string) => g.trim());
          return genres.length <= 10;
        })
        .withMessage('Maximum 10 genres allowed'),
      query('year')
        .optional()
        .isInt({ min: 1940, max: new Date().getFullYear() + 2 })
        .toInt()
        .withMessage('Invalid year'),
      query('season')
        .optional()
        .isIn(['WINTER', 'SPRING', 'SUMMER', 'FALL'])
        .withMessage('Season must be WINTER, SPRING, SUMMER, or FALL'),
      query('status')
        .optional()
        .isIn(['FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED'])
        .withMessage('Invalid status'),
      query('format')
        .optional()
        .isString()
        .custom((value) => {
          const validFormats = ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'];
          const formats = value.split(',').map((f: string) => f.trim());
          return formats.every((f: string) => validFormats.includes(f));
        })
        .withMessage('Invalid format(s)'),
      query('sort')
        .optional()
        .isString()
        .custom((value) => {
          const validSorts = [
            'POPULARITY_DESC',
            'SCORE_DESC',
            'TRENDING_DESC',
            'UPDATED_AT_DESC',
            'START_DATE_DESC',
          ];
          const sorts = value.split(',').map((s: string) => s.trim());
          return sorts.every((s: string) => validSorts.includes(s));
        })
        .withMessage('Invalid sort option(s)'),
      query('isAdult').optional().isBoolean().toBoolean(),
      query('page').optional().isInt({ min: 1 }).toInt(),
      query('perPage').optional().isInt({ min: 1, max: 50 }).toInt(),
    ];
  }

  /**
   * Validation rules for manga/novel search
   */
  static readingMediaSearchRules() {
    return [
      query('q').optional().trim().isLength({ min: 2, max: 100 }),
      query('genres')
        .optional()
        .isString()
        .custom((value) => {
          const genres = value.split(',').map((g: string) => g.trim());
          return genres.length <= 10;
        })
        .withMessage('Maximum 10 genres allowed'),
      query('format')
        .optional()
        .isString()
        .custom((value) => {
          const validFormats = ['MANGA', 'ONE_SHOT', 'MANHWA', 'MANHUA', 'NOVEL', 'LIGHT_NOVEL'];
          const formats = value.split(',').map((f: string) => f.trim());
          return formats.every((f: string) => validFormats.includes(f));
        })
        .withMessage('Invalid format(s)'),
      query('status')
        .optional()
        .isIn(['FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED'])
        .withMessage('Invalid status'),
      query('sort')
        .optional()
        .isString()
        .custom((value) => {
          const validSorts = ['POPULARITY_DESC', 'SCORE_DESC', 'TRENDING_DESC', 'UPDATED_AT_DESC'];
          const sorts = value.split(',').map((s: string) => s.trim());
          return sorts.every((s: string) => validSorts.includes(s));
        })
        .withMessage('Invalid sort option(s)'),
      query('isAdult').optional().isBoolean().toBoolean(),
      query('page').optional().isInt({ min: 1 }).toInt(),
      query('perPage').optional().isInt({ min: 1, max: 50 }).toInt(),
    ];
  }

  /**
   * Validation rules for trending endpoint
   */
  static trendingRules() {
    return [
      query('type').optional().isIn(['anime', 'manga', 'novel', 'all']).withMessage('Invalid type'),
      query('page').optional().isInt({ min: 1 }).toInt(),
      query('perPage').optional().isInt({ min: 1, max: 50 }).toInt(),
    ];
  }

  /**
   * Validation rules for seasonal anime endpoint
   */
  static seasonalRules() {
    return [
      query('season')
        .notEmpty()
        .isIn(['WINTER', 'SPRING', 'SUMMER', 'FALL'])
        .withMessage('Season is required and must be WINTER, SPRING, SUMMER, or FALL'),
      query('year')
        .notEmpty()
        .isInt({ min: 1940, max: new Date().getFullYear() + 2 })
        .toInt()
        .withMessage('Year is required and must be valid'),
      query('sort')
        .optional()
        .isString()
        .custom((value) => {
          const validSorts = ['POPULARITY_DESC', 'SCORE_DESC', 'TRENDING_DESC'];
          const sorts = value.split(',').map((s: string) => s.trim());
          return sorts.every((s: string) => validSorts.includes(s));
        })
        .withMessage('Invalid sort option(s)'),
      query('page').optional().isInt({ min: 1 }).toInt(),
      query('perPage').optional().isInt({ min: 1, max: 50 }).toInt(),
    ];
  }

  /**
   * Validation rules for popular endpoint
   */
  static popularRules() {
    return [
      query('type')
        .notEmpty()
        .isIn(['anime', 'manga', 'novel'])
        .withMessage('Type is required and must be anime, manga, or novel'),
      query('timeRange')
        .optional()
        .isIn(['week', 'month', 'year', 'all'])
        .withMessage('timeRange must be week, month, year, or all'),
      query('page').optional().isInt({ min: 1 }).toInt(),
      query('perPage').optional().isInt({ min: 1, max: 50 }).toInt(),
    ];
  }

  /**
   * Validate request and return errors if any
   */
  static validate(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => ({
          field: err.type === 'field' ? err.path : undefined,
          message: err.msg,
        })),
      });
    }
    return next();
  }
}

export default SearchValidator;
