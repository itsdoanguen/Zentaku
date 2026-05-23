import express, { type Router } from 'express';
import type { Container } from '../../config/container';
import { authenticate } from '../../middlewares/authenticate';
import type MessageController from './controllers/message.controller';
import {
  sendMessageValidation,
  getMessageHistoryValidation,
  updateReadCursorValidation,
} from './validators/message.validator';

const initializeMessageRoutes = (container: Container): Router => {
  const router = express.Router();
  const messageController = container.resolve<MessageController>('messageController');

  // All message endpoints require authentication
  router.use(authenticate);

  /**
   * @swagger
   * /api/channels/{channelId}/messages:
   *   post:
   *     tags: [Message]
   *     summary: Send a message to a channel
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [content]
   *             properties:
   *               content:
   *                 type: string
   *     responses:
   *       201:
   *         description: Message sent successfully
   */
  router.post(
    '/channels/:channelId/messages',
    sendMessageValidation,
    messageController.sendMessage
  );

  /**
   * @swagger
   * /api/channels/{channelId}/messages:
   *   get:
   *     tags: [Message]
   *     summary: Get message history for a channel
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *       - in: query
   *         name: before
   *         description: The ID of the message to paginate backwards from
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Message history retrieved successfully
   */
  router.get(
    '/channels/:channelId/messages',
    getMessageHistoryValidation,
    messageController.getMessageHistory
  );

  /**
   * @swagger
   * /api/channels/{channelId}/read-cursor:
   *   patch:
   *     tags: [Message]
   *     summary: Update read cursor for a channel
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [lastReadMessageId]
   *             properties:
   *               lastReadMessageId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Read cursor updated successfully
   */
  router.patch(
    '/channels/:channelId/read-cursor',
    updateReadCursorValidation,
    messageController.updateReadCursor
  );

  return router;
};

export = initializeMessageRoutes;
