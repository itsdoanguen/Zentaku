/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Reading Media Module Container Loader
 *
 * Unified loader for both Manga and Novel reading media.
 * @module ReadingMediaLoader
 */

import logger from '../../shared/utils/logger';

/**
 * Load reading media module dependencies into container
 *
 * @param {Container} container - DI Container instance
 */
const loadReadingMedia = (container: any): void => {
  container.register(
    'readingMediaAdapter',
    () => {
      const ReadingMediaAdapter =
        require('../../modules/reading-media/reading-media.adapter').default ||
        require('../../modules/reading-media/reading-media.adapter');

      const adapter = new ReadingMediaAdapter();

      return adapter;
    },
    {
      singleton: true,
    }
  );

  container.register(
    'readingMediaRepository',
    (c: any) => {
      const ReadingMediaRepository =
        require('../../modules/reading-media/reading-media.repository').default ||
        require('../../modules/reading-media/reading-media.repository');
      const { ReadingMediaItem } = require('../../entities');
      const dataSource = c.resolve('dataSource');
      const typeormRepository = dataSource.getRepository(ReadingMediaItem);
      const repository = new ReadingMediaRepository(typeormRepository);

      return repository;
    },
    {
      singleton: true,
      dependencies: ['dataSource'],
    }
  );

  container.register(
    'readingMediaService',
    (c: any) => {
      const ReadingMediaService =
        require('../../modules/reading-media/reading-media.service').default ||
        require('../../modules/reading-media/reading-media.service');

      const repository = c.resolve('readingMediaRepository');
      const adapter = c.resolve('readingMediaAdapter');
      const anilistClient = c.resolve('anilistReadingMediaClient');
      const characterClient = c.resolve('anilistCharacterClient');
      const staffClient = c.resolve('anilistStaffClient');
      return new ReadingMediaService(
        repository,
        adapter,
        anilistClient,
        characterClient,
        staffClient
      );
    },
    {
      singleton: true,
      dependencies: [
        'readingMediaRepository',
        'readingMediaAdapter',
        'anilistReadingMediaClient',
        'anilistCharacterClient',
        'anilistStaffClient',
      ],
    }
  );

  container.register(
    'readingMediaController',
    (c: any) => {
      const ReadingMediaController =
        require('../../modules/reading-media/reading-media.controller').default ||
        require('../../modules/reading-media/reading-media.controller');
      const readingMediaService = c.resolve('readingMediaService');

      const controller = new ReadingMediaController(readingMediaService);

      return controller;
    },
    {
      singleton: true,
      dependencies: ['readingMediaService'],
    }
  );

  logger.info('[Loader] Reading Media module registered (Manga & Novel)');
};

export = loadReadingMedia;
