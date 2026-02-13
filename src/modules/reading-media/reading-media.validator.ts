/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from 'express';
import type { ValidationChain } from 'express-validator';
import { param, query, validationResult } from 'express-validator';

/**
 * Reading Media Validator
 *
 * Unified validation rules for both Manga and Novel endpoints.
 * All rules work for both media types since they share the same structure.
 */
class ReadingMediaValidator {
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

  static getCharactersRules(): ValidationChain[] {
    return [
      param('anilistId')
        .notEmpty()
        .withMessage('anilistId is required')
        .isInt({ min: 1 })
        .withMessage('anilistId must be a positive integer')
        .toInt(),

      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page must be a positive integer')
        .toInt(),

      query('perPage')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('perPage must be between 1 and 50')
        .toInt(),
    ];
  }

  static getStaffRules(): ValidationChain[] {
    return [
      param('anilistId')
        .notEmpty()
        .withMessage('anilistId is required')
        .isInt({ min: 1 })
        .withMessage('anilistId must be a positive integer')
        .toInt(),

      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page must be a positive integer')
        .toInt(),

      query('perPage')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('perPage must be between 1 and 50')
        .toInt(),
    ];
  }

  static searchRules(): ValidationChain[] {
    return [
      query('q')
        .optional()
        .isString()
        .withMessage('q must be a string')
        .trim()
        .isLength({ min: 1 })
        .withMessage('q must not be empty when provided'),

      query('query')
        .optional()
        .isString()
        .withMessage('query must be a string')
        .trim()
        .isLength({ min: 1 })
        .withMessage('query must not be empty when provided'),

      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page must be a positive integer')
        .toInt(),

      query('perPage')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('perPage must be between 1 and 50')
        .toInt(),
    ];
  }

  /**
   * Validation middleware to check for errors
   * Execute after validation rules to handle validation results
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

export = ReadingMediaValidator;
