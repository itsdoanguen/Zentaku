/**
 * List Routes
 *
 * Endpoint declarations for the List Feature
 */

import express, { type Router } from 'express';
import type { Container } from '../../config/container';
import { authenticate } from '../../middlewares/authenticate';
import type ListController from './controllers/list.controller';
import { canEditList, canViewList, isListOwner } from './middlewares/list.guards';
import {
  addMemberValidation,
  createListValidation,
  listIdParamValidation,
  respondToRequestValidation,
  updateListValidation,
  updateMemberPermissionValidation,
  updateThemeValidation,
  getUserListsValidation,
  searchListValidation,
  requestJoinValidation,
  requestEditValidation,
  removeMemberValidation,
} from './validators/list.validators';

const initializeListRoutes = (container: Container): Router => {
  const router = express.Router();
  const listController = container.resolve<ListController>('listController');

  // ==================== PHASE 1: CRUD ====================

  /**
   * @swagger
   * /api/list/create:
   *   post:
   *     summary: Create a new custom list
   *     description: Create a new anime list owned by the authenticated user
   *     tags: [List]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateListRequest'
   *     responses:
   *       201:
   *         description: List created successfully
   *       400:
   *         description: Validation failed
   *       401:
   *         description: Unauthorized
   */
  router.post('/create', authenticate, createListValidation, listController.createList);

  /**
   * @swagger
   * /api/list/user:
   *   get:
   *     summary: Get user's lists
   *     description: Get all public/private lists by username
   *     tags: [List]
   *     parameters:
   *       - in: query
   *         name: username
   *         required: true
   *         schema:
   *           type: string
   *         example: john_doe
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lists retrieved successfully
   *       400:
   *         description: Validation failed
   */
  router.get('/user', getUserListsValidation, listController.getUserLists);

  /**
   * @swagger
   * /api/list/{listId}:
   *   get:
   *     summary: Get list detail
   *     description: Get detailed information about a specific list including anime items
   *     tags: [List]
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List detail retrieved successfully
   *       403:
   *         description: Access denied (private list)
   *       404:
   *         description: List not found
   */
  router.get(
    '/:listId',
    listIdParamValidation,
    canViewList(container),
    listController.getListDetail
  );

  /**
   * @swagger
   * /api/list/anime/{listId}:
   *   get:
   *     summary: Get anime items in list
   *     description: Get all anime items in a specific list
   *     tags: [List]
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Anime items retrieved successfully
   *       404:
   *         description: List not found
   */
  router.get(
    '/anime/:listId',
    listIdParamValidation,
    canViewList(container),
    listController.getListAnimes
  );

  /**
   * @swagger
   * /api/list/{listId}/update:
   *   put:
   *     summary: Update list details
   *     description: Update name, description, privacy, or banner image of a list
   *     tags: [List]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateListRequest'
   *     responses:
   *       200:
   *         description: List updated successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not list owner
   *       404:
   *         description: List not found
   */
  router.put(
    '/:listId/update',
    authenticate,
    listIdParamValidation,
    updateListValidation,
    canEditList(container),
    isListOwner(container),
    listController.updateList
  );

  /**
   * @swagger
   * /api/list/{listId}/delete:
   *   delete:
   *     summary: Delete a list
   *     description: Permanently delete a custom list (soft delete)
   *     tags: [List]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     responses:
   *       200:
   *         description: List deleted successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not list owner
   *       404:
   *         description: List not found
   */
  router.delete(
    '/:listId/delete',
    authenticate,
    listIdParamValidation,
    canEditList(container),
    isListOwner(container),
    listController.deleteList
  );

  // ==================== PHASE 2: MEMBER MANAGEMENT ====================

  /**
   * @swagger
   * /api/list/member/{listId}/list:
   *   get:
   *     summary: Get list members
   *     description: Return owner and accepted members (editor/viewer) of a list
   *     tags: [List Members]
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Members retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ListMembersResponse'
   *       400:
   *         description: Validation failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       403:
   *         description: Access denied
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: List not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get(
    '/member/:listId/list',
    listIdParamValidation,
    canViewList(container),
    listController.listMembers
  );

  /**
   * @swagger
   * /api/list/member/{listId}/add:
   *   post:
   *     summary: Add member to list
   *     description: Owner adds or updates a member role (editor/viewer)
   *     tags: [List Members]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AddListMemberRequest'
   *     responses:
   *       200:
   *         description: Member added successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Validation failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Only owner can add members
   *       404:
   *         description: List or user not found
   */
  router.post(
    '/member/:listId/add',
    authenticate,
    listIdParamValidation,
    addMemberValidation,
    canEditList(container),
    isListOwner(container),
    listController.addMember
  );

  /**
   * @swagger
   * /api/list/member/{listId}/permission:
   *   put:
   *     summary: Update member permission
   *     description: Owner changes an existing member role between editor and viewer
   *     tags: [List Members]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateListMemberPermissionRequest'
   *     responses:
   *       200:
   *         description: Member permission updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Validation failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Only owner can update member permissions
   *       404:
   *         description: List, user, or member not found
   */
  router.put(
    '/member/:listId/permission',
    authenticate,
    listIdParamValidation,
    updateMemberPermissionValidation,
    canEditList(container),
    isListOwner(container),
    listController.updateMemberPermission
  );

  /**
   * @swagger
   * /api/list/member/{listId}/remove:
   *   delete:
   *     summary: Remove member from list
   *     description: Owner removes a member by username; owner cannot remove themselves
   *     tags: [List Members]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: username
   *         required: true
   *         schema:
   *           type: string
   *         example: jane_doe
   *     responses:
   *       200:
   *         description: Member removed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Validation failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Only owner can remove members
   *       404:
   *         description: List, user, or member not found
   */
  router.delete(
    '/member/:listId/remove',
    authenticate,
    listIdParamValidation,
    removeMemberValidation,
    canEditList(container),
    isListOwner(container),
    listController.removeMember
  );

  // ==================== PHASE 3: INVITES & REQUESTS ====================

  /**
   * @swagger
   * /api/list/{listId}/request-join:
   *   post:
   *     summary: Request to join a public list
   *     tags: [List Requests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ListRequestBody'
   *     responses:
   *       200:
   *         description: Join request submitted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Validation failed or already requested
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: List not found
   */
  router.post(
    '/:listId/request-join',
    authenticate,
    listIdParamValidation,
    requestJoinValidation,
    listController.requestJoin
  );

  /**
   * @swagger
   * /api/list/{listId}/request-edit:
   *   post:
   *     summary: Request editor role for a list
   *     tags: [List Requests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ListRequestBody'
   *     responses:
   *       200:
   *         description: Edit request submitted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Validation failed or already requested
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Only viewers can request edit permission
   *       404:
   *         description: List not found
   */
  router.post(
    '/:listId/request-edit',
    authenticate,
    listIdParamValidation,
    requestEditValidation,
    listController.requestEdit
  );

  /**
   * @swagger
   * /api/list/{listId}/requests:
   *   get:
   *     summary: Get pending list requests
   *     tags: [List Requests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *     responses:
   *       200:
   *         description: Pending requests retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ListRequestsResponse'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Only owner can view requests
   *       404:
   *         description: List not found
   */
  router.get(
    '/:listId/requests',
    authenticate,
    listIdParamValidation,
    listController.getListRequests
  );

  /**
   * @swagger
   * /api/list/{listId}/join-requests/{requestId}/respond:
   *   post:
   *     summary: Respond to join request
   *     tags: [List Requests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 101
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RespondToRequestBody'
   *     responses:
   *       200:
   *         description: Join request processed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Validation failed
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Only owner can respond to requests
   *       404:
   *         description: List or request not found
   */
  router.post(
    '/:listId/join-requests/:requestId/respond',
    authenticate,
    respondToRequestValidation,
    listController.respondToRequest
  );

  /**
   * @swagger
   * /api/list/{listId}/edit-requests/{requestId}/respond:
   *   post:
   *     summary: Respond to edit request
   *     tags: [List Requests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 101
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RespondToRequestBody'
   *     responses:
   *       200:
   *         description: Edit request processed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Validation failed
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Only owner can respond to requests
   *       404:
   *         description: List or request not found
   */
  router.post(
    '/:listId/edit-requests/:requestId/respond',
    authenticate,
    respondToRequestValidation,
    listController.respondToRequest
  );

  // ==================== PHASE 4: THEME & LIKES ====================

  /**
   * @swagger
   * /api/list/{listId}/theme:
   *   put:
   *     summary: Update list theme
   *     tags: [List Theme]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - themeKey
   *             properties:
   *               themeKey:
   *                 type: string
   *                 example: summer-vibes
   *               themeColor:
   *                 type: string
   *                 example: '#FFAA00'
   */
  router.put(
    '/:listId/theme',
    authenticate,
    listIdParamValidation,
    updateThemeValidation,
    listController.updateTheme
  );

  /**
   * @swagger
   * /api/list/{listId}/like:
   *   post:
   *     summary: Toggle like on a list
   *     tags: [List Likes]
   *     security:
   *       - bearerAuth: []
   */
  router.post('/:listId/like', authenticate, listIdParamValidation, listController.toggleLike);

  /**
   * @swagger
   * /api/list/{listId}/like/status:
   *   get:
   *     summary: Get like status
   *     tags: [List Likes]
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    '/:listId/like/status',
    authenticate,
    listIdParamValidation,
    listController.getLikeStatus
  );

  // ==================== PHASE 5: SEARCH ====================

  /**
   * @swagger
   * /api/list/search:
   *   post:
   *     summary: Search lists
   *     tags: [List Search]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - query
   *             properties:
   *               query:
   *                 type: string
   *                 example: action
   *               sortBy:
   *                 type: string
   *                 enum: [RECENT, MOST_LIKED, NAME]
   *               page:
   *                 type: integer
   *                 example: 1
   *               limit:
   *                 type: integer
   *                 example: 20
   *               isPublicOnly:
   *                 type: boolean
   */
  router.post('/search', searchListValidation, listController.searchLists);

  return router;
};

export = initializeListRoutes;
