import express, { type Router } from 'express';
import type { Container } from '../../config/container';
import { authenticate } from '../../middlewares/authenticate';
import type WatchPartyController from './controllers/watch-party.controller';
import {
  createWatchRoomValidation,
  getWatchRoomValidation,
  updatePlaybackStateValidation,
} from './validators/watch-party.validator';

const initializeWatchPartyRoutes = (container: Container): Router => {
  const router = express.Router();
  const watchPartyController = container.resolve<WatchPartyController>('watchPartyController');

  router.use(authenticate);

  router.post('/', createWatchRoomValidation, watchPartyController.createWatchRoom);
  router.get('/:channelId', getWatchRoomValidation, watchPartyController.getWatchRoom);
  router.patch(
    '/:channelId/state',
    updatePlaybackStateValidation,
    watchPartyController.updatePlaybackState
  );
  router.post('/:channelId/join', getWatchRoomValidation, watchPartyController.joinWatchRoom);
  router.post('/:channelId/leave', getWatchRoomValidation, watchPartyController.leaveWatchRoom);

  return router;
};

export = initializeWatchPartyRoutes;
