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
      return new ListService(listRepository, userRepository, animeRepository);
    },
    {
      singleton: true,
      dependencies: ['listRepository', 'userRepository', 'animeRepository'],
    }
  );

  container.register(
    'listController',
    (c: any) => {
      const ListController =
        require('../../modules/list/controllers/list.controller').default ||
        require('../../modules/list/controllers/list.controller');
      const listService = c.resolve('listService');
      return new ListController(listService);
    },
    {
      singleton: true,
      dependencies: ['listService'],
    }
  );

  logger.info('[Loader] List module registered');
};

export = loadList;
