/**
 * Manga Module Container Loader
 *
 * @module MangaLoader
 */

import logger from '../../shared/utils/logger';

/**
 * Load manga module dependencies into container
 *
 * @param {Container} container - DI Container instance
 */
const loadManga = (container: any): void => {
  container.register(
    'mangaAdapter',
    () => {
      const MangaAdapter =
        require('../../modules/manga/manga.adapter').default ||
        require('../../modules/manga/manga.adapter');

      const adapter = new MangaAdapter();

      return adapter;
    },
    {
      singleton: true,
    }
  );

  container.register(
    'mangaRepository',
    (c: any) => {
      const MangaRepository =
        require('../../modules/manga/manga.repository').default ||
        require('../../modules/manga/manga.repository');
      const { MangaItem } = require('../../entities');
      const dataSource = c.resolve('dataSource');
      const typeormRepository = dataSource.getRepository(MangaItem);
      const repository = new MangaRepository(typeormRepository);

      return repository;
    },
    {
      singleton: true,
      dependencies: ['dataSource'],
    }
  );

  container.register(
    'mangaService',
    (c: any) => {
      const MangaService =
        require('../../modules/manga/manga.service').default ||
        require('../../modules/manga/manga.service');

      const repository = c.resolve('mangaRepository');
      const adapter = c.resolve('mangaAdapter');
      const anilistClient = c.resolve('anilistMangaClient');
      const characterClient = c.resolve('anilistCharacterClient');
      const staffClient = c.resolve('anilistStaffClient');
      return new MangaService(repository, adapter, anilistClient, characterClient, staffClient);
    },
    {
      singleton: true,
      dependencies: [
        'mangaRepository',
        'mangaAdapter',
        'anilistMangaClient',
        'anilistCharacterClient',
        'anilistStaffClient',
      ],
    }
  );

  container.register(
    'mangaController',
    (c: any) => {
      const MangaController =
        require('../../modules/manga/manga.controller').default ||
        require('../../modules/manga/manga.controller');
      const mangaService = c.resolve('mangaService');

      const controller = new MangaController(mangaService);

      return controller;
    },
    {
      singleton: true,
      dependencies: ['mangaService'],
    }
  );

  logger.info('[Loader] Manga module registered');
};

export = loadManga;
