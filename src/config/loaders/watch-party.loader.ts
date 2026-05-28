import logger from '../../shared/utils/logger';
import type { Container } from '../container';

const loadWatchParty = (container: Container): void => {
  // Configured to use InMemoryWatchRoom, repository dependencies removed for MVP.

  container.register(
    'watchPartyService',
    (_c: any) => {
      const {
        WatchPartyService,
      } = require('../../modules/watch-party/services/watch-party.service');
      return new WatchPartyService();
    },
    {
      singleton: true,
      dependencies: [],
    }
  );

  container.register(
    'watchPartyController',
    (c: any) => {
      const WatchPartyController =
        require('../../modules/watch-party/controllers/watch-party.controller').default ||
        require('../../modules/watch-party/controllers/watch-party.controller');
      const watchPartyService = c.resolve('watchPartyService');
      return new WatchPartyController(watchPartyService);
    },
    {
      singleton: true,
      dependencies: ['watchPartyService'],
    }
  );

  container.register(
    'watchPartyHandler',
    (c: any) => {
      const { WatchPartyHandler } = require('../../realtime/handlers/watch-party.handler');
      const realtimeGateway = c.resolve('realtimeGateway');
      return new WatchPartyHandler(realtimeGateway);
    },
    {
      singleton: true,
      dependencies: ['realtimeGateway', 'watchPartyService'],
    }
  );

  // We immediately resolve the handler to instantiate it so that the events are registered
  // to the realtimeGateway when the app starts.
  if (container.has('realtimeGateway')) {
    container.resolve('watchPartyHandler');
  }

  logger.info('[Loader] Watch-party module registered');
};

export = loadWatchParty;
