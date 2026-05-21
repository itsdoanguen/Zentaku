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
  router.get('/', listCommunitiesValidation, communityController.listCommunities);

  // Authenticated endpoints
  router.use(authenticate);

  router.post('/', createCommunityValidation, communityController.createCommunity);
  router.post('/join', joinCommunityValidation, communityController.joinCommunity);
  router.get('/:communityId', getCommunityValidation, communityController.getCommunityDetail);
  router.put('/:communityId', updateCommunityValidation, communityController.updateCommunity);
  router.delete('/:communityId', getCommunityValidation, communityController.deleteCommunity);
  router.post('/:communityId/leave', getCommunityValidation, communityController.leaveCommunity);

  return router;
};

export = initializeCommunityRoutes;
