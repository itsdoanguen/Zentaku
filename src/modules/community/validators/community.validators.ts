import type { NextFunction, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';

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

export const createCommunityValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Community name is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Community name must be between 3 and 255 characters'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean').toBoolean(),

  handleValidationErrors,
];

export const updateCommunityValidation = [
  param('communityId').notEmpty().withMessage('Community ID is required'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Community name must be between 3 and 255 characters'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean').toBoolean(),

  handleValidationErrors,
];

export const joinCommunityValidation = [
  body('inviteCode')
    .trim()
    .notEmpty()
    .withMessage('Invite code is required')
    .isLength({ max: 50 })
    .withMessage('Invite code must not exceed 50 characters'),

  handleValidationErrors,
];

export const getCommunityValidation = [
  param('communityId').notEmpty().withMessage('Community ID is required'),

  handleValidationErrors,
];

export const listCommunitiesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),

  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('perPage must be between 1 and 100')
    .toInt(),

  query('q').optional().trim().isString(),

  query('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean').toBoolean(),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'membersCount', 'name'])
    .withMessage('Invalid sortBy field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('Invalid sortOrder field')
    .customSanitizer((val) => val.toLowerCase()),

  handleValidationErrors,
];
