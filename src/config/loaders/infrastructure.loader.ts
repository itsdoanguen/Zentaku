/**
 * Infrastructure Layer Container Loader
 *
 * Registers core infrastructure dependencies:
 * - Database (TypeORM DataSource)
 * - HTTP Client
 * - Logger
 * - External API Clients
 *
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
  /**
   * TypeORM DataSource
   * Singleton instance for database operations
   */
  container.register(
    'dataSource',
    () => {
      return AppDataSource;
    },
    {
      singleton: true,
    }
  );

  /**
   * HTTP Client
   * Singleton instance for external HTTP requests
   */
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

  /**
   * Logger Utility
   * Singleton logger instance
   */
  container.register(
    'logger',
    () => {
      return logger;
    },
    {
      singleton: true,
    }
  );

  /**
   * AniList Anime Client
   * Handles all AniList API operations for anime
   */
  container.register(
    'anilistAnimeClient',
    () => {
      const AnilistAnimeClient =
        require('../../infrastructure/external/anilist/AnilistAnimeClient').default ||
        require('../../infrastructure/external/anilist/AnilistAnimeClient');
      const client = new AnilistAnimeClient();
      return client;
    },
    {
      singleton: true,
      dependencies: ['httpClient'],
    }
  );

  /**
   * AniList Metadata Adapter
   * Implements IMetadataSource interface using AniList
   */
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
