import logger from '../../shared/utils/logger';
import type { Container } from '../container';

const loadWatchParty = (container: Container): void => {
  // Configured to use InMemoryWatchRoom, repository dependencies removed for MVP.

  container.register(
    'watchPartyService',
    (c: any) => {
      const {
        WatchPartyService,
      } = require('../../modules/watch-party/services/watch-party.service');
      const realtimeGateway = c.has('realtimeGateway') ? c.resolve('realtimeGateway') : undefined;
      const notificationService = c.has('notificationService')
        ? c.resolve('notificationService')
        : undefined;
      const channelService = c.has('channelService') ? c.resolve('channelService') : undefined;
      const messageService = c.has('messageService') ? c.resolve('messageService') : undefined;
      const userRepository = c.has('userRepository') ? c.resolve('userRepository') : undefined;
      return new WatchPartyService(
        realtimeGateway,
        notificationService,
        channelService,
        messageService,
        userRepository
      );
    },
    {
      singleton: true,
      dependencies: [
        'realtimeGateway',
        'notificationService',
        'channelService',
        'messageService',
        'userRepository',
      ],
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
