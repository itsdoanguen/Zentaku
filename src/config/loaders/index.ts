/**
 * Container Loaders Index
 *
 * @module Loaders
 */

import logger from '../../shared/utils/logger';
import type { Container } from '../container';
import authLoader = require('./auth.loader');
import realtimeLoader = require('./realtime.loader');
import infrastructureLoader = require('./infrastructure.loader');
import animeLoader = require('./anime.loader');
import readingMediaLoader = require('./reading-media.loader');
import streamingLoader = require('./streaming.loader');
import searchLoader = require('./search.loader');
import listLoader = require('./list.loader');
import userLoader = require('./user.loader');
import activityLoader = require('./activity.loader');
import followLoader = require('./follow.loader');
import communityLoader = require('./community.loader');
import channelLoader = require('./channel.loader');
import messageLoader = require('./message.loader');
import scheduleLoader = require('./schedule.loader');
import watchPartyLoader = require('./watch-party.loader');
import notificationLoader = require('./notification.loader');

/**
 * Load all modules into the container

 * @param {Container} container - DI Container instance
 */
const loadModules = (container: Container): void => {
  logger.debug('[Loaders] Starting module registration...');

  infrastructureLoader(container);

  authLoader(container);

  realtimeLoader(container);

  userLoader(container);

  notificationLoader(container);

  animeLoader(container);

  readingMediaLoader(container);

  streamingLoader(container);

  searchLoader(container);

  activityLoader(container);
  followLoader(container);
  communityLoader(container);
  channelLoader(container);
  listLoader(container);
  messageLoader(container);
  scheduleLoader(container);
  watchPartyLoader(container);

  logger.debug('[Loaders] All modules registered successfully');
  logger.debug(`[Loaders] Total registered: ${container.getRegistered().length} dependencies`);
};

export = loadModules;
