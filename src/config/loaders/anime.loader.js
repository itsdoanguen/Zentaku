/**
 * Anime Module Container Loader
 * 
 * Registers all anime-related dependencies:
 * - Adapter (Data transformation)
 * - Repository (Data access)
 * - Service (Business logic)
 * - Controller (HTTP handlers)
 * 
 * @module AnimeLoader
 */

/**
 * Load anime module dependencies into container
 * 
 * @param {Container} container - DI Container instance
 */
module.exports = (container) => {
  /**
   * Anime Adapter
   * Transforms data between AniList API, Database, and API Response formats
   */
  container.register('animeAdapter', () => {
    const AnimeAdapter = require('../../modules/anime/anime.adapter');
    
    const adapter = new AnimeAdapter();
    
    return adapter;
  }, { 
    singleton: true 
  });

  /**
   * Anime Repository
   * Data access layer for anime entities
   */
  container.register('animeRepository', (c) => {
    const AnimeRepository = require('../../modules/anime/anime.repository');
    const prisma = c.resolve('prisma');
    
    let repository;
    repository = new AnimeRepository(prisma);
    
    return repository;
  }, { 
    singleton: true,
    dependencies: ['prisma']
  });

  /**
   * Anime Service
   * Business logic layer for anime operations
   */
  container.register('animeService', (c) => {
    const AnimeService = require('../../modules/anime/anime.service');
    
    const repository = c.resolve('animeRepository');
    const adapter = c.resolve('animeAdapter');
    const anilistClient = c.resolve('anilistAnimeClient');
    return new AnimeService(repository, adapter, anilistClient);
  }, { 
    singleton: true,
    dependencies: ['animeRepository', 'animeAdapter', 'anilistAnimeClient']
  });

  /**
   * Anime Controller
   * HTTP request handler layer for anime endpoints
   */
  container.register('animeController', (c) => {
    const AnimeController = require('../../modules/anime/anime.controller');
    const animeService = c.resolve('animeService');
    
    let controller;
    controller = new AnimeController(animeService);    
    return controller;
  }, { 
    singleton: true,
    dependencies: ['animeService']
  });

  const logger = container.resolve('logger');
  logger.info('[Loader] Anime module registered ✓');
};
