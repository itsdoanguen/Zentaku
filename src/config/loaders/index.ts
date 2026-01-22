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

import infrastructureLoader = require('./infrastructure.loader');
import animeLoader = require('./anime.loader');
import logger from '../../shared/utils/logger';

/**
 * Load all modules into the container
 *
 * This function orchestrates the loading of all application modules
 * in the correct dependency order. Infrastructure must load first
 * as other modules depend on it.

 * @param {Container} container - DI Container instance
 *
 * @example
 * import { AppDataSource } from './config/database';
 * import loadModules from './config/loaders';
 * 
 * await AppDataSource.initialize();
 * const container = new Container();
 * loadModules(container);
 */
const loadModules = (container: any): void => {
  logger.debug('[Loaders] Starting module registration...');

  infrastructureLoader(container);

  animeLoader(container);

  logger.debug('[Loaders] All modules registered successfully');
  logger.debug(`[Loaders] Total registered: ${container.getRegistered().length} dependencies`);
};

export = loadModules;
