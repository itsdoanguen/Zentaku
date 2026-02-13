/**
 * Infrastructure Layer Container Loader
 * @module InfrastructureLoader
 */

import logger from '../../shared/utils/logger';
import { AppDataSource } from '../database';

/**
 * Load infrastructure dependencies into container
 *
 * @param {Container} container - DI Container instance
 */
const loadInfrastructure = (container: any): void => {
  //Load database data source
  container.register(
    'dataSource',
    () => {
      return AppDataSource;
    },
    {
      singleton: true,
    }
  );

  //Load HTTP Client
  container.register(
    'httpClient',
    () => {
      const httpClient = require('../../infrastructure/http/httpClient');
      return httpClient;
    },
    {
      singleton: true,
    }
  );

  //Load logger utility
  container.register(
    'logger',
    () => {
      return logger;
    },
    {
      singleton: true,
    }
  );

  //Load AniList Anime Client
  container.register(
    'anilistAnimeClient',
    () => {
      const AnilistAnimeClient =
        require('../../infrastructure/external/anilist/anime/AnilistAnimeClient').default ||
        require('../../infrastructure/external/anilist/anime/AnilistAnimeClient');
      const client = new AnilistAnimeClient();
      return client;
    },
    {
      singleton: true,
      dependencies: ['httpClient'],
    }
  );

  //Load AniList Reading Media Client (Manga & Novel)
  container.register(
    'anilistReadingMediaClient',
    () => {
      const AnilistReadingMediaClient =
        require('../../infrastructure/external/anilist/reading-media/AnilistReadingMediaClient')
          .default ||
        require('../../infrastructure/external/anilist/reading-media/AnilistReadingMediaClient');
      const client = new AnilistReadingMediaClient();
      return client;
    },
    {
      singleton: true,
      dependencies: ['httpClient'],
    }
  );

  //Load AniList Character Client
  container.register(
    'anilistCharacterClient',
    () => {
      const AnilistCharacterClient =
        require('../../infrastructure/external/anilist/character/AnilistCharacterClient').default ||
        require('../../infrastructure/external/anilist/character/AnilistCharacterClient');
      const client = new AnilistCharacterClient();
      return client;
    },
    {
      singleton: true,
      dependencies: ['httpClient'],
    }
  );

  //Load AniList Staff Client
  container.register(
    'anilistStaffClient',
    () => {
      const AnilistStaffClient =
        require('../../infrastructure/external/anilist/staff/AnilistStaffClient').default ||
        require('../../infrastructure/external/anilist/staff/AnilistStaffClient');
      const client = new AnilistStaffClient();
      return client;
    },
    {
      singleton: true,
      dependencies: ['httpClient'],
    }
  );

  //Load AniList Metadata Adapter
  container.register(
    'anilistMetadataAdapter',
    () => {
      const AnilistMetadataAdapter =
        require('../../infrastructure/external/anilist/AnilistMetadataAdapter').default ||
        require('../../infrastructure/external/anilist/AnilistMetadataAdapter');
      const adapter = new AnilistMetadataAdapter();
      return adapter;
    },
    {
      singleton: true,
      dependencies: ['anilistAnimeClient'],
    }
  );

  logger.info('[Loader] Infrastructure layer registered');
};

export = loadInfrastructure;
