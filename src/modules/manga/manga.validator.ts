import type { NextFunction, Request, Response } from 'express';
import type { ValidationChain } from 'express-validator';
import { param, validationResult } from 'express-validator';

class MangaValidator {
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

  static validate(req: Request, res: Response, next: NextFunction): Response | void {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((error) => ({
        field:
          error.type === 'field'
            ? error.path
            : 'param' in error
              ? (error as { param: string }).param
              : 'unknown',
        message: error.msg,
        value:
          error.type === 'field' && 'value' in error
            ? (error as { value: unknown }).value
            : undefined,
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

export = MangaValidator;
