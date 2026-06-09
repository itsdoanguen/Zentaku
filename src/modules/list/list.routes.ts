/**
 * List Routes
 *
 * Endpoint declarations for the List Feature
 */

import express, { type Router } from 'express';
import type { Container } from '../../config/container';
import { authenticate } from '../../middlewares/authenticate';
import { listBannerUpload } from '../../middlewares/upload';
import type ListController from './controllers/list.controller';
import { canEditList, canViewList, isListOwner } from './middlewares/list.guards';

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
   *         description: Invalid request payload
   *       401:
   *         description: Unauthorized
   */
  router.post('/create', authenticate, listController.createList);

  /**
   * @swagger
   * /api/list/upload-banner:
   *   post:
   *     summary: Upload banner image for a list
   *     tags: [List]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Uploaded successfully
   */
  router.post(
    '/upload-banner',
    authenticate,
    listBannerUpload.single('file'),
    listController.uploadBanner
  );

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
   *         description: Invalid request query
   */
  router.get('/user', listController.getUserLists);

  /**
   * @swagger
   * /api/list/user/joined:
   *   get:
   *     summary: Get lists joined by the user
   *     tags: [List]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lists retrieved successfully
   */
  router.get('/user/joined', authenticate, listController.getUserJoinedLists);

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
  router.get('/:listId', canViewList(container), listController.getListDetail);

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
  router.get('/anime/:listId', canViewList(container), listController.getListAnimes);

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
    canEditList(container),
    isListOwner(container),
    listController.deleteList
  );

  /**
   * @swagger
   * /api/list/{listId}/chat:
   *   post:
   *     summary: Create or get list chat
   *     description: Create a community and channel for the list or get existing ones
   *     tags: [List]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Chat created or retrieved successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not list owner
   *       404:
   *         description: List not found
   */
  router.post('/:listId/chat', authenticate, isListOwner(container), listController.createListChat);

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
   *         description: Invalid request data
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
  router.get('/member/:listId/list', canViewList(container), listController.listMembers);

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
   *         description: Invalid request data
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
   *         description: Invalid request data
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
   *         description: Invalid request data
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
   *         description: Invalid request or already requested
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: List not found
   */
  router.post('/:listId/request-join', authenticate, listController.requestJoin);

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
   *         description: Invalid request or already requested
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Only viewers can request edit permission
   *       404:
   *         description: List not found
   */
  router.post('/:listId/request-edit', authenticate, listController.requestEdit);

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
  router.get('/:listId/requests', authenticate, listController.getListRequests);

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
   *         description: Invalid request data
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
   *         description: Invalid request data
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
   *             type: object
   *             required:
   *               - themeKey
   *             properties:
   *               themeKey:
   *                 type: string
   *                 example: summer-vibes
   *                 description: Theme key (e.g., summer-vibes, neon-night, pastel-dream)
   *               themeColor:
   *                 type: string
   *                 example: '#FFAA00'
   *                 description: Hex color override for theme
   *     responses:
   *       200:
   *         description: Theme updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     settings:
   *                       type: object
   *                       properties:
   *                         themeKey:
   *                           type: string
   *                         themeColor:
   *                           type: string
   */
  router.put('/:listId/theme', authenticate, listController.updateTheme);

  /**
   * @swagger
   * /api/list/{listId}/like:
   *   post:
   *     summary: Toggle like on a list
   *     tags: [List Likes]
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
   *         description: Like status toggled successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: Like status toggled
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: List not found
   */
  router.post('/:listId/like', authenticate, listController.toggleLike);

  /**
   * @swagger
   * /api/list/{listId}/like/status:
   *   get:
   *     summary: Get like status and count
   *     tags: [List Likes]
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
   *         description: Like status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     likedByMe:
   *                       type: boolean
   *                       example: true
   *                     likeCount:
   *                       type: integer
   *                       example: 42
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: List not found
   */
  router.get('/:listId/like/status', authenticate, listController.getLikeStatus);

  /**
   * @swagger
   * /api/list/{listId}/likers:
   *   get:
   *     summary: Get list likers
   *     tags: [List Likes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *         example: 1
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: List likers retrieved successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: List not found
   */
  router.get('/:listId/likers', canViewList(container), listController.getListLikers);

  /**
   * @swagger
   * /api/list/likes/most-liked:
   *   get:
   *     summary: Get most liked lists (public only)
   *     tags: [List Likes]
   *     description: Discover lists sorted by like count (descending). Returns public lists only.
   *     security: []
   *     parameters:
   *       - in: query
   *         name: page
   *         required: false
   *         schema:
   *           type: integer
   *           default: 1
   *         example: 1
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           type: integer
   *           default: 10
   *         example: 10
   *     responses:
   *       200:
   *         description: Most liked lists retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       ownerUsername:
   *                         type: string
   *                       likeCount:
   *                         type: integer
   *                       itemCount:
   *                         type: integer
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   */
  router.get('/likes/most-liked', listController.getMostLikedLists);
  router.post('/likes/most-liked', listController.getMostLikedLists);

  /**
   * @swagger
   * /api/list/likes/user:
   *   post:
   *     summary: Get lists liked by current user
   *     tags: [List Likes]
   *     description: Get all public lists that the authenticated user has liked, sorted by most recent first.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               page:
   *                 type: integer
   *                 example: 1
   *               limit:
   *                 type: integer
   *                 example: 10
   *     responses:
   *       200:
   *         description: User liked lists retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       ownerUsername:
   *                         type: string
   *                       likeCount:
   *                         type: integer
   *                       itemCount:
   *                         type: integer
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *       401:
   *         description: Unauthorized
   */
  router.post('/likes/user', authenticate, listController.getUserLikedLists);

  // ==================== PHASE 5: SEARCH ====================
  // Search lists (kept as POST for backward compatibility)
  router.post('/search', listController.searchLists);

  /**
   * @swagger
   * /api/list/anime/{listId}/add:
   *   post:
   *     summary: Add anime to list
   *     description: Add an anime to the list by AniList ID (requires Editor permission). The anime must exist in the database.
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
   *             type: object
   *             required:
   *               - anilistId
   *             properties:
   *               anilistId:
   *                 type: integer
   *                 description: The AniList ID of the anime
   *                 example: 1
   *               note:
   *                 type: string
   *                 description: Optional note about the anime in the list
   *     responses:
   *       200:
   *         description: Anime added
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Invalid request or anime not found
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: No edit permission
   *       404:
   *         description: List not found
   */
  router.post('/anime/:listId/add', authenticate, listController.addAnimeToList);

  /**
   * @swagger
   * /api/list/anime/{listId}/{anilistId}/remove:
   *   delete:
   *     summary: Remove anime from list
   *     description: Remove an anime from the list by AniList ID (requires Editor permission). The anime must exist in the database.
   *     tags: [List]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: listId
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: anilistId
   *         required: true
   *         schema:
   *           type: integer
   *           description: The AniList ID of the anime
   *           example: 1
   *     responses:
   *       200:
   *         description: Anime removed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MessageResponse'
   *       400:
   *         description: Invalid request or anime not found
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: No edit permission
   *       404:
   *         description: List not found
   */
  router.delete(
    '/anime/:listId/:anilistId/remove',
    authenticate,
    listController.removeAnimeFromList
  );

  return router;
};

export = initializeListRoutes;
