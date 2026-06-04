/**
 * Notification Container Loader
 *
 * Registers notification module dependencies in the DI container.
 *
 * @module NotificationLoader
 */

import logger from '../../shared/utils/logger';
import type { Container } from '../container';

const loadNotification = (container: Container): void => {
  // 1. Register NotificationRepository
  container.register(
    'notificationRepository',
    (c: Container) => {
      const { Notification } = require('../../entities');
      const {
        NotificationRepository,
      } = require('../../modules/notification/repositories/notification.repository');
      const dataSource = c.resolve('dataSource');
      const typeormRepository = (dataSource as any).getRepository(Notification);

      return new NotificationRepository(typeormRepository);
    },
    {
      singleton: true,
      dependencies: ['dataSource'],
    }
  );

  // 2. Register NotificationService
  container.register(
    'notificationService',
    (c: Container) => {
      const {
        NotificationService,
      } = require('../../modules/notification/services/notification.service');
      const notificationRepository = c.resolve('notificationRepository');
      const realtimeGateway = c.resolve('realtimeGateway');

      return new NotificationService(notificationRepository, realtimeGateway);
    },
    {
      singleton: true,
      dependencies: ['notificationRepository', 'realtimeGateway'],
    }
  );

  // 3. Register NotificationController
  container.register(
    'notificationController',
    (c: Container) => {
      const NotificationController =
        require('../../modules/notification/controllers/notification.controller').default ||
        require('../../modules/notification/controllers/notification.controller');
      const notificationService = c.resolve('notificationService');

      return new NotificationController(notificationService);
    },
    {
      singleton: true,
      dependencies: ['notificationService'],
    }
  );

  logger.info('[Loader] Notification module registered');
};

export = loadNotification;
