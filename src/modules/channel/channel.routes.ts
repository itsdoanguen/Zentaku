import express, { type Router } from 'express';
import type { Container } from '../../config/container';
import { authenticate } from '../../middlewares/authenticate';
import type ChannelController from './controllers/channel.controller';
import {
  createChannelValidation,
  createPrivateChannelValidation,
  getChannelValidation,
  listChannelsValidation,
} from './validators/channel.validator';

const initializeChannelRoutes = (container: Container): Router => {
  const router = express.Router();
  const channelController = container.resolve<ChannelController>('channelController');

  // Authenticated endpoints for channels
  router.use(authenticate);

  /**
   * @swagger
   * /api/communities/{communityId}/channels:
   *   post:
   *     tags: [Channel]
   *     summary: Create a channel in a community
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
   *             required: [name]
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               isPrivate:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Channel created successfully
   */
  router.post(
    '/communities/:communityId/channels',
    createChannelValidation,
    channelController.createChannel
  );

  /**
   * @swagger
   * /api/communities/{communityId}/channels:
   *   get:
   *     tags: [Channel]
   *     summary: List channels in a community
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
   *         description: List of channels retrieved successfully
   */
  router.get(
    '/communities/:communityId/channels',
    listChannelsValidation,
    channelController.listChannels
  );

  /**
   * @swagger
   * /api/channels/private:
   *   post:
   *     tags: [Channel]
   *     summary: Create or get a private DM channel
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [participantId]
   *             properties:
   *               participantId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Private channel retrieved or created successfully
   */
  router.post(
    '/channels/private',
    createPrivateChannelValidation,
    channelController.createOrGetPrivateChannel
  );

  /**
   * @swagger
   * /api/channels/{channelId}:
   *   get:
   *     tags: [Channel]
   *     summary: Get channel details
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Channel details retrieved successfully
   */
  router.get('/channels/:channelId', getChannelValidation, channelController.getChannelDetail);

  return router;
};

export = initializeChannelRoutes;
