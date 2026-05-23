import type { NextFunction, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ChannelType } from '../../../entities/types/enums';

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

export const createChannelValidation = [
  param('communityId').notEmpty().withMessage('Community ID is required'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Channel name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Channel name must be between 1 and 100 characters'),

  body('type')
    .notEmpty()
    .withMessage('Channel type is required')
    .isIn(Object.values(ChannelType))
    .withMessage(`Channel type must be one of: ${Object.values(ChannelType).join(', ')}`),

  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean').toBoolean(),

  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('position must be a non-negative integer')
    .toInt(),

  handleValidationErrors,
];

export const listChannelsValidation = [
  param('communityId').notEmpty().withMessage('Community ID is required'),

  handleValidationErrors,
];

export const createPrivateChannelValidation = [
  body('recipientId')
    .notEmpty()
    .withMessage('recipientId is required')
    .custom((val) => {
      try {
        BigInt(val);
        return true;
      } catch {
        throw new Error('recipientId must be a valid big integer');
      }
    }),

  handleValidationErrors,
];

export const getChannelValidation = [
  param('channelId').notEmpty().withMessage('Channel ID is required'),

  handleValidationErrors,
];
