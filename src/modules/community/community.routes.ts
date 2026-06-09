import express, { type Router } from 'express';
import type { Container } from '../../config/container';
import { authenticate } from '../../middlewares/authenticate';
import type CommunityController from './controllers/community.controller';
import {
  createCommunityValidation,
  getCommunityValidation,
  joinCommunityValidation,
  listCommunitiesValidation,
  updateCommunityValidation,
} from './validators/community.validators';

const initializeCommunityRoutes = (container: Container): Router => {
  const router = express.Router();
  const communityController = container.resolve<CommunityController>('communityController');

  // Public/Search endpoints
  /**
   * @swagger
   * /api/communities:
   *   get:
   *     tags: [Community]
   *     summary: List communities
   *     description: Retrieve a paginated list of communities, optionally filtered by keyword.
   *     parameters:
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: A paginated list of communities
   */
  router.get('/', listCommunitiesValidation, communityController.listCommunities);

  // Authenticated endpoints
  router.use(authenticate);

  /**
   * @swagger
   * /api/communities:
   *   post:
   *     tags: [Community]
   *     summary: Create a new community
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name]
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               avatarUrl:
   *                 type: string
   *               bannerUrl:
   *                 type: string
   *               isPrivate:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Community created successfully
   */
  router.post('/', createCommunityValidation, communityController.createCommunity);

  /**
   * @swagger
   * /api/communities/join:
   *   post:
   *     tags: [Community]
   *     summary: Join a community
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [communityId]
   *             properties:
   *               communityId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Successfully joined the community
   */
  router.post('/join', joinCommunityValidation, communityController.joinCommunity);

  /**
   * @swagger
   * /api/communities/{communityId}:
   *   get:
   *     tags: [Community]
   *     summary: Get community details
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: communityId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Community details retrieved successfully
   */
  router.get('/:communityId', getCommunityValidation, communityController.getCommunityDetail);

  /**
   * @swagger
   * /api/communities/{communityId}:
   *   put:
   *     tags: [Community]
   *     summary: Update a community
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: communityId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               avatarUrl:
   *                 type: string
   *               bannerUrl:
   *                 type: string
   *               isPrivate:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Community updated successfully
   */
  router.put('/:communityId', updateCommunityValidation, communityController.updateCommunity);

  /**
   * @swagger
   * /api/communities/{communityId}/members:
   *   get:
   *     tags: [Community]
   *     summary: Get community members
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: communityId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Community members retrieved successfully
   */
  router.get(
    '/:communityId/members',
    getCommunityValidation,
    communityController.getCommunityMembers
  );

  /**
   * @swagger
   * /api/communities/{communityId}:
   *   delete:
   *     tags: [Community]
   *     summary: Delete a community
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: communityId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Community deleted successfully
   */
  router.delete('/:communityId', getCommunityValidation, communityController.deleteCommunity);

  /**
   * @swagger
   * /api/communities/{communityId}/leave:
   *   post:
   *     tags: [Community]
   *     summary: Leave a community
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: communityId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Successfully left the community
   */
  router.post('/:communityId/leave', getCommunityValidation, communityController.leaveCommunity);

  /**
   * @swagger
   * /api/communities/{communityId}/mute:
   *   post:
   *     tags: [Community]
   *     summary: Toggle mute for a community
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: communityId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               isMuted:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Successfully toggled mute
   */
  router.post('/:communityId/mute', getCommunityValidation, communityController.toggleMute);

  return router;
};

export = initializeCommunityRoutes;
