/**
 * Container Loaders Index
 *
 * @module Loaders
 */

import infrastructureLoader = require('./infrastructure.loader');
import animeLoader = require('./anime.loader');
import streamingLoader = require('./streaming.loader');
import logger from '../../shared/utils/logger';

/**
 * Load all modules into the container

 * @param {Container} container - DI Container instance
 */
const loadModules = (container: any): void => {
  logger.debug('[Loaders] Starting module registration...');

  infrastructureLoader(container);

  animeLoader(container);

  streamingLoader(container);

  logger.debug('[Loaders] All modules registered successfully');
  logger.debug(`[Loaders] Total registered: ${container.getRegistered().length} dependencies`);
};

export = loadModules;
