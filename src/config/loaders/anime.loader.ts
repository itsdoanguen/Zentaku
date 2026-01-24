/**
 * Anime Module Container Loader
 *
 * @module AnimeLoader
 */

import logger from '../../shared/utils/logger';

/**
 * Load anime module dependencies into container
 *
 * @param {Container} container - DI Container instance
 */
const loadAnime = (container: any): void => {
  /**
   * Anime Adapter
   * Transforms data between AniList API, Database, and API Response formats
   */
  container.register(
    'animeAdapter',
    () => {
      const AnimeAdapter =
        require('../../modules/anime/anime.adapter').default ||
        require('../../modules/anime/anime.adapter');

      const adapter = new AnimeAdapter();

      return adapter;
    },
    {
      singleton: true,
    }
  );

  container.register(
    'animeRepository',
    (c: any) => {
      const AnimeRepository =
        require('../../modules/anime/anime.repository').default ||
        require('../../modules/anime/anime.repository');
      const { AnimeItem } = require('../../entities');
      const dataSource = c.resolve('dataSource');
      const typeormRepository = dataSource.getRepository(AnimeItem);
      const repository = new AnimeRepository(typeormRepository);

      return repository;
    },
    {
      singleton: true,
      dependencies: ['dataSource'],
    }
  );

  container.register(
    'animeService',
    (c: any) => {
      const AnimeService =
        require('../../modules/anime/anime.service').default ||
        require('../../modules/anime/anime.service');

      const repository = c.resolve('animeRepository');
      const adapter = c.resolve('animeAdapter');
      const anilistClient = c.resolve('anilistAnimeClient');
      const characterClient = c.resolve('anilistCharacterClient');
      const staffClient = c.resolve('anilistStaffClient');
      return new AnimeService(repository, adapter, anilistClient, characterClient, staffClient);
    },
    {
      singleton: true,
      dependencies: [
        'animeRepository',
        'animeAdapter',
        'anilistAnimeClient',
        'anilistCharacterClient',
        'anilistStaffClient',
      ],
    }
  );

  container.register(
    'animeController',
    (c: any) => {
      const AnimeController =
        require('../../modules/anime/anime.controller').default ||
        require('../../modules/anime/anime.controller');
      const animeService = c.resolve('animeService');

      const controller = new AnimeController(animeService);

      return controller;
    },
    {
      singleton: true,
      dependencies: ['animeService'],
    }
  );

  logger.info('[Loader] Anime module registered');
};

export = loadAnime;
