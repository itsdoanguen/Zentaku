/**
 * Streaming Module Container Loader
 *
 * @module StreamingLoader
 */

import logger from '../../shared/utils/logger';

const loadStreaming = (container: any): void => {
  //Load MALSync Client
  container.register(
    'malSyncClient',
    () => {
      const { MalSyncClient } = require('../../infrastructure/external/malsync');
      return new MalSyncClient();
    },
    { singleton: true }
  );

  //Load Aniwatch Client
  container.register(
    'aniwatchClient',
    () => {
      const { AniwatchClient } = require('../../infrastructure/external/aniwatch');
      return new AniwatchClient();
    },
    { singleton: true }
  );

  //Load Streaming Service
  container.register(
    'streamingService',
    (c: any) => {
      const StreamingService = require('../../modules/streaming/streaming.service').default;
      const animeRepository = c.resolve('animeRepository');
      const animeService = c.resolve('animeService');
      const malSyncClient = c.resolve('malSyncClient');
      const aniwatchClient = c.resolve('aniwatchClient');

      return new StreamingService(animeRepository, animeService, malSyncClient, aniwatchClient);
    },
    {
      singleton: true,
      dependencies: ['animeRepository', 'animeService', 'malSyncClient', 'aniwatchClient'],
    }
  );

  //Load Streaming Controller
  container.register(
    'streamingController',
    (c: any) => {
      const StreamingController = require('../../modules/streaming/streaming.controller').default;
      const streamingService = c.resolve('streamingService');

      return new StreamingController(streamingService);
    },
    {
      singleton: true,
      dependencies: ['streamingService'],
    }
  );

  logger.info('[Loader] Streaming module registered ✅');
};

export = loadStreaming;
