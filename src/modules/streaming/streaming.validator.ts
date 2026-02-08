import type { NextFunction, Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: errors.array(),
      },
    });
    return;
  }
  next();
};

export const validateGetEpisodeSources = [
  param('anilistId').isInt({ min: 1 }).withMessage('AniList ID must be a positive integer').toInt(),

  param('episodeNumber')
    .isInt({ min: 1 })
    .withMessage('Episode number must be a positive integer')
    .toInt(),

  query('server')
    .optional()
    .isIn(['hd-1', 'hd-2', 'meg-1', 'meg-2'])
    .withMessage('Invalid server. Must be: hd-1, hd-2, meg-1, or meg-2'),

  query('category')
    .optional()
    .isIn(['sub', 'dub', 'raw'])
    .withMessage('Invalid category. Must be: sub, dub, or raw'),

  handleValidationErrors,
];

export const validateGetEpisodes = [
  param('anilistId').isInt({ min: 1 }).withMessage('AniList ID must be a positive integer').toInt(),

  handleValidationErrors,
];

export const validateSyncHianimeId = [
  param('anilistId').isInt({ min: 1 }).withMessage('AniList ID must be a positive integer').toInt(),

  handleValidationErrors,
];
