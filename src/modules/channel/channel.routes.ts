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

  router.post(
    '/communities/:communityId/channels',
    createChannelValidation,
    channelController.createChannel
  );
  router.get(
    '/communities/:communityId/channels',
    listChannelsValidation,
    channelController.listChannels
  );
  router.post(
    '/channels/private',
    createPrivateChannelValidation,
    channelController.createOrGetPrivateChannel
  );
  router.get('/channels/:channelId', getChannelValidation, channelController.getChannelDetail);

  return router;
};

export = initializeChannelRoutes;
