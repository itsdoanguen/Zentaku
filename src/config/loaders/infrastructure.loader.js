/**
 * Infrastructure Layer Container Loader
 * 
 * Registers core infrastructure dependencies:
 * - Database (Prisma)
 * - HTTP Client
 * - Logger
 * - External API Clients
 * 
 * @module InfrastructureLoader
 */

/**
 * Load infrastructure dependencies into container
 * 
 * @param {Container} container - DI Container instance
 */
module.exports = (container) => {
  /**
   * Prisma Database Client
   * Singleton instance for database operations
   */
  container.register('prisma', () => {
    const prisma = require('../database');
    return prisma;
  }, { 
    singleton: true 
  });

  /**
   * HTTP Client
   * Singleton instance for external HTTP requests
   */
  container.register('httpClient', () => {
    const httpClient = require('../../infrastructure/http/httpClient');
    return httpClient;
  }, { 
    singleton: true 
  });

  /**
   * Logger Utility
   * Singleton logger instance
   */
  container.register('logger', () => {
    const logger = require('../../shared/utils/logger');
    return logger;
  }, { 
    singleton: true 
  });
        
  /**
   * AniList Anime Client
   * Handles all AniList API operations for anime
   */
  container.register('anilistAnimeClient', () => {
    const AnilistAnimeClient = require('../../infrastructure/external/anilist/AnilistAnimeClient');
    const client = new AnilistAnimeClient();
    return client;
  }, { 
    singleton: true,
    dependencies: ['httpClient']
  });

  /**
   * AniList Metadata Adapter
   * Implements IMetadataSource interface using AniList
   */
  container.register('anilistMetadataAdapter', () => {
    const AnilistMetadataAdapter = require('../../infrastructure/external/anilist/AnilistMetadataAdapter');
    const adapter = new AnilistMetadataAdapter();
    return adapter;
  }, { 
    singleton: true,
    dependencies: ['anilistAnimeClient']
  });

  const logger = container.resolve('logger');
  logger.info('[Loader] Infrastructure layer registered ✓');
};
