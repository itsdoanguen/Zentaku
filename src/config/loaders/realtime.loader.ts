import { RealtimeGateway } from '../../realtime/gateway/gateway';
import { EventDispatcherService } from '../../realtime/services/event-dispatcher.service';
import { RoomOrchestratorService } from '../../realtime/services/room-orchestrator.service';
import logger from '../../shared/utils/logger';

/**
 * Realtime Container Loader
 * Registers gateway and application services in the DI container.
 *
 * @module RealtimeLoader
 */
const loadRealtime = (container: any): void => {
  logger.debug('[RealtimeLoader] Registering realtime services...');

  // 1. Register RealtimeGateway
  container.register(
    'realtimeGateway',
    () => {
      return new RealtimeGateway();
    },
    {
      singleton: true,
    }
  );

  // 2. Register RoomOrchestratorService
  container.register(
    'roomOrchestratorService',
    (c: any) => {
      return new RoomOrchestratorService(c.resolve('realtimeGateway'));
    },
    {
      singleton: true,
      dependencies: ['realtimeGateway'],
    }
  );

  // 3. Register EventDispatcherService
  container.register(
    'eventDispatcherService',
    (c: any) => {
      return new EventDispatcherService(
        c.resolve('realtimeGateway'),
        c.resolve('roomOrchestratorService')
      );
    },
    {
      singleton: true,
      dependencies: ['realtimeGateway', 'roomOrchestratorService'],
    }
  );

  // 4. Eagerly resolve EventDispatcherService to bind its event handlers
  container.resolve('eventDispatcherService');

  logger.info('[Loader] Realtime layer registered');
};

export = loadRealtime;
