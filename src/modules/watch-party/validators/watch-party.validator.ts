import { body, param } from 'express-validator';

export const createWatchRoomValidation = [
  body('channelId')
    .optional({ nullable: true })
    .isString()
    .withMessage('channelId must be a string'),
  body('mediaId')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage('mediaId must be a valid id'),
  body('currentSourceUrl')
    .optional({ nullable: true })
    .isString()
    .withMessage('currentSourceUrl must be a string'),
  body('settings').optional().isObject().withMessage('settings must be an object'),
];

export const getWatchRoomValidation = [
  param('channelId')
    .notEmpty()
    .withMessage('channelId is required')
    .isString()
    .withMessage('channelId must be a string'),
];

export const updatePlaybackStateValidation = [
  param('channelId')
    .notEmpty()
    .withMessage('channelId is required')
    .isString()
    .withMessage('channelId must be a string'),
  body('action')
    .notEmpty()
    .withMessage('action is required')
    .isIn(['play', 'pause', 'seek'])
    .withMessage('action must be one of: play, pause, seek'),
  body('timestamp').optional().isNumeric().withMessage('timestamp must be a number'),
];

export const inviteToWatchRoomValidation = [
  param('channelId')
    .notEmpty()
    .withMessage('channelId is required')
    .isString()
    .withMessage('channelId must be a string'),
  body('targetUserId')
    .notEmpty()
    .withMessage('targetUserId is required')
    .isNumeric()
    .withMessage('targetUserId must be a valid user id'),
];
