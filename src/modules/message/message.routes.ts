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

  router.post(
    '/channels/:channelId/messages',
    sendMessageValidation,
    messageController.sendMessage
  );

  router.get(
    '/channels/:channelId/messages',
    getMessageHistoryValidation,
    messageController.getMessageHistory
  );

  router.patch(
    '/channels/:channelId/read-cursor',
    updateReadCursorValidation,
    messageController.updateReadCursor
  );

  return router;
};

export = initializeMessageRoutes;
