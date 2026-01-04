/**
 * Container Loaders Index
 * 
 * Aggregates and exports all module loaders.
 * Loaders are executed in order to properly manage dependencies.
 * 
 * Order of loading:
 * 1. Infrastructure (database, HTTP, logger, external clients)
 * 2. Domain modules (anime, media, user, etc.)
 * 
 * @module Loaders
 */

const infrastructureLoader = require('./infrastructure.loader');
const animeLoader = require('./anime.loader');

/**
 * Load all modules into the container
 * 
 * This function orchestrates the loading of all application modules
 * in the correct dependency order. Infrastructure must load first
 * as other modules depend on it.
 * 
 * @param {Container} container - DI Container instance
 * 
 * @example
 * const container = new Container();
 * const loadModules = require('./loaders');
 * loadModules(container);
 */
module.exports = (container) => {
  const logger = require('../../shared/utils/logger');
  
  logger.info('[Loaders] Starting module registration...');

  infrastructureLoader(container);

  // Domain Modules
  animeLoader(container);
  
  logger.info('[Loaders] All modules registered successfully ✓');
  logger.info(`[Loaders] Total registered: ${container.getRegistered().length} dependencies`);
};
