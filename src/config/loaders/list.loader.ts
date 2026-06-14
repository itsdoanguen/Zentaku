/**
 * List Module Loader
 *
 * Load list module dependencies into the DI container
 */

import type { Container } from '../container';
import logger from '../../shared/utils/logger';

const loadList = (container: Container): void => {
  if (!container.has('listRepository')) {
    container.register(
      'listRepository',
      (c: any) => {
        const { CustomList } = require('../../entities');
        const { ListRepository } = require('../../modules/list/repositories/list.repository');
        const dataSource = c.resolve('dataSource');
        const typeormRepository = dataSource.getRepository(CustomList);

        return new ListRepository(typeormRepository);
      },
      {
        singleton: true,
        dependencies: ['dataSource'],
      }
    );
  }

  container.register(
    'listService',
    (c: any) => {
      const { ListService } = require('../../modules/list/services/list.service');
      const listRepository = c.resolve('listRepository');
      const userRepository = c.resolve('userRepository');
      const animeRepository = c.resolve('animeRepository');
      const communityService = c.resolve('communityService');
      const channelService = c.resolve('channelService');
      const notificationService = c.has('notificationService')
        ? c.resolve('notificationService')
        : undefined;
      return new ListService(
        listRepository,
        userRepository,
        animeRepository,
        communityService,
        channelService,
        notificationService
      );
    },
    {
      singleton: true,
      dependencies: [
        'listRepository',
        'userRepository',
        'animeRepository',
        'communityService',
        'channelService',
        'notificationService',
      ],
    }
  );

  container.register(
    'recommendationService',
    (c: any) => {
      const {
        RecommendationService,
      } = require('../../modules/list/services/recommendation.service');
      const listRepository = c.resolve('listRepository');
      const anilistAnimeClient = c.resolve('anilistAnimeClient');
      return new RecommendationService(listRepository, anilistAnimeClient);
    },
    {
      singleton: true,
      dependencies: ['listRepository', 'anilistAnimeClient'],
    }
  );

  container.register(
    'listController',
    (c: any) => {
      const ListController =
        require('../../modules/list/controllers/list.controller').default ||
        require('../../modules/list/controllers/list.controller');
      const listService = c.resolve('listService');
      const recommendationService = c.resolve('recommendationService');
      return new ListController(listService, recommendationService);
    },
    {
      singleton: true,
      dependencies: ['listService', 'recommendationService'],
    }
  );

  logger.info('[Loader] List module registered');
};

export = loadList;
