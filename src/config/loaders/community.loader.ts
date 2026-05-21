import logger from '../../shared/utils/logger';
import type { Container } from '../container';

const loadCommunity = (container: Container): void => {
  if (!container.has('communityRepository')) {
    container.register(
      'communityRepository',
      (c: any) => {
        const { Community } = require('../../entities');
        const {
          CommunityRepository,
        } = require('../../modules/community/repositories/community.repository');
        const dataSource = c.resolve('dataSource');
        const typeormRepository = dataSource.getRepository(Community);

        return new CommunityRepository(typeormRepository);
      },
      {
        singleton: true,
        dependencies: ['dataSource'],
      }
    );
  }

  if (!container.has('communityMemberRepository')) {
    container.register(
      'communityMemberRepository',
      (c: any) => {
        const { CommunityMember } = require('../../entities');
        const {
          CommunityMemberRepository,
        } = require('../../modules/community/repositories/community-member.repository');
        const dataSource = c.resolve('dataSource');
        const typeormRepository = dataSource.getRepository(CommunityMember);

        return new CommunityMemberRepository(typeormRepository);
      },
      {
        singleton: true,
        dependencies: ['dataSource'],
      }
    );
  }

  container.register(
    'communityService',
    (c: any) => {
      const { CommunityService } = require('../../modules/community/services/community.service');
      const communityRepository = c.resolve('communityRepository');
      const communityMemberRepository = c.resolve('communityMemberRepository');
      return new CommunityService(communityRepository, communityMemberRepository);
    },
    {
      singleton: true,
      dependencies: ['communityRepository', 'communityMemberRepository'],
    }
  );

  container.register(
    'communityController',
    (c: any) => {
      const CommunityController =
        require('../../modules/community/controllers/community.controller').default ||
        require('../../modules/community/controllers/community.controller');
      const communityService = c.resolve('communityService');
      return new CommunityController(communityService);
    },
    {
      singleton: true,
      dependencies: ['communityService'],
    }
  );

  logger.info('[Loader] Community module registered');
};

export = loadCommunity;
