/**
 * List Module Validators
 *
 * Express-validator validation chains for the List Feature
 */

import { body, param, query, type ValidationChain } from 'express-validator';

// ==================== CRUD VALIDATORS ====================

export const createListValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('List name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('List name must be between 1 and 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),

  body('privacy')
    .optional()
    .isIn(['PUBLIC', 'PRIVATE', 'SHARED'])
    .withMessage('Privacy must be PUBLIC, PRIVATE, or SHARED'),

  body('bannerImage').optional().isURL().withMessage('Banner image must be a valid URL'),
];

export const updateListValidation: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('List name must be between 1 and 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters'),

  body('privacy')
    .optional()
    .isIn(['PUBLIC', 'PRIVATE', 'SHARED'])
    .withMessage('Privacy must be PUBLIC, PRIVATE, or SHARED'),

  body('bannerImage')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Banner image must be a valid URL'),
];

export const listIdParamValidation: ValidationChain[] = [
  param('listId').isInt({ min: 1 }).withMessage('List ID must be a positive integer'),
];

// ==================== MEMBER MANAGEMENT VALIDATORS ====================

export const addMemberValidation: ValidationChain[] = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Username is invalid'),

  body('permission')
    .optional()
    .isIn(['EDITOR', 'VIEWER'])
    .withMessage('Permission must be EDITOR or VIEWER'),

  body('permission_level')
    .optional()
    .isIn(['owner', 'edit', 'view', 'viewer'])
    .withMessage('permission_level must be owner, edit, view, or viewer'),

  body('can_edit').optional().isBoolean().withMessage('can_edit must be a boolean'),
];

export const updateMemberPermissionValidation: ValidationChain[] = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Username is invalid'),

  body('permission')
    .optional()
    .isIn(['EDITOR', 'VIEWER'])
    .withMessage('Permission must be EDITOR or VIEWER'),

  body('permission_level')
    .optional()
    .isIn(['owner', 'edit', 'view', 'viewer'])
    .withMessage('permission_level must be owner, edit, view, or viewer'),

  body('can_edit').optional().isBoolean().withMessage('can_edit must be a boolean'),
];

export const removeMemberValidation: ValidationChain[] = [
  query('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Username is invalid'),
];

// ==================== INVITE & REQUEST VALIDATORS ====================

export const inviteMemberValidation: ValidationChain[] = [
  body('username').trim().notEmpty().withMessage('Username is required'),

  body('permission')
    .notEmpty()
    .isIn(['EDITOR', 'VIEWER'])
    .withMessage('Permission must be EDITOR or VIEWER'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be less than 500 characters'),
];

export const requestJoinValidation: ValidationChain[] = [
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be less than 500 characters'),
];

export const requestEditValidation: ValidationChain[] = requestJoinValidation;

export const respondToRequestValidation: ValidationChain[] = [
  body('action')
    .notEmpty()
    .custom((value) => {
      const normalized = String(value).trim().toUpperCase();
      return ['ACCEPT', 'REJECT', 'APPROVE', 'DECLINE'].includes(normalized);
    })
    .withMessage('Action must be ACCEPT, REJECT, approve, or reject'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be less than 500 characters'),

  param('requestId').isInt({ min: 1 }).withMessage('Request ID must be a positive integer'),
];

export const respondToInviteValidation: ValidationChain[] = [
  body('action')
    .notEmpty()
    .custom((value) => {
      const normalized = String(value).trim().toUpperCase();
      return ['ACCEPT', 'REJECT', 'APPROVE', 'DECLINE'].includes(normalized);
    })
    .withMessage('Action must be ACCEPT, REJECT, approve, or reject'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be less than 500 characters'),

  param('inviteId').isInt({ min: 1 }).withMessage('Invite ID must be a positive integer'),
];

// ==================== THEME VALIDATORS ====================

export const updateThemeValidation: ValidationChain[] = [
  body('themeKey')
    .trim()
    .notEmpty()
    .withMessage('Theme key is required')
    .isLength({ max: 50 })
    .withMessage('Theme key must be less than 50 characters'),

  body('themeColor')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Theme color must be a valid hex color'),
];

// ==================== ANIME ITEM VALIDATORS ====================

export const addAnimeToListValidation: ValidationChain[] = [
  body('anilistId').isInt({ min: 1 }).withMessage('AniList ID must be a positive integer'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note must be less than 500 characters'),
];

export const mediaIdParamValidation: ValidationChain[] = [
  param('mediaId').isInt({ min: 1 }).withMessage('Media ID must be a positive integer'),
];

// ==================== SEARCH VALIDATORS ====================

export const searchListValidation: ValidationChain[] = [
  body('query')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Query must be between 1 and 255 characters'),

  body('sortBy')
    .optional()
    .isIn(['RECENT', 'MOST_LIKED', 'NAME'])
    .withMessage('Invalid sort option'),

  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  body('isPublicOnly').optional().isBoolean().withMessage('isPublicOnly must be a boolean'),
];

// ==================== QUERY VALIDATORS ====================

export const getUserListsValidation: ValidationChain[] = [
  query('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Username is invalid'),
];

export const paginationValidation: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];
