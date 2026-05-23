import type { NextFunction, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PAYLOAD_INVALID',
        message: 'Validation failed',
        statusCode: 400,
        details: errors.array(),
      },
    });
    return;
  }
  next();
};

export const sendMessageValidation = [
  param('channelId')
    .notEmpty()
    .withMessage('Channel ID is required')
    .custom((val) => {
      try {
        BigInt(val);
        return true;
      } catch {
        throw new Error('Channel ID must be a valid big integer');
      }
    }),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 4000 })
    .withMessage('Message content must be under 4000 characters'),

  body('replyToId')
    .optional({ nullable: true })
    .custom((val) => {
      try {
        BigInt(val);
        return true;
      } catch {
        throw new Error('replyToId must be a valid big integer');
      }
    }),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('attachments must be an array'),

  handleValidationErrors,
];

export const getMessageHistoryValidation = [
  param('channelId')
    .notEmpty()
    .withMessage('Channel ID is required')
    .custom((val) => {
      try {
        BigInt(val);
        return true;
      } catch {
        throw new Error('Channel ID must be a valid big integer');
      }
    }),

  query('cursor')
    .optional()
    .isString()
    .withMessage('cursor must be a base64 encoded string'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100')
    .toInt(),

  query('direction')
    .optional()
    .isIn(['backward', 'forward'])
    .withMessage('direction must be either backward or forward'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc'),

  handleValidationErrors,
];

export const updateReadCursorValidation = [
  param('channelId')
    .notEmpty()
    .withMessage('Channel ID is required')
    .custom((val) => {
      try {
        BigInt(val);
        return true;
      } catch {
        throw new Error('Channel ID must be a valid big integer');
      }
    }),

  body('lastReadMessageId')
    .notEmpty()
    .withMessage('lastReadMessageId is required')
    .custom((val) => {
      try {
        BigInt(val);
        return true;
      } catch {
        throw new Error('lastReadMessageId must be a valid big integer');
      }
    }),

  handleValidationErrors,
];
export const getChannelValidation = [
  param('channelId').notEmpty().withMessage('Channel ID is required'),
  handleValidationErrors,
];
