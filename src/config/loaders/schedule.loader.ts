import logger from '../../shared/utils/logger';

const loadSchedule = (container: any): void => {
  container.register(
    'scheduleController',
    () => {
      const ScheduleController =
        require('../../modules/schedule/schedule.controller').default ||
        require('../../modules/schedule/schedule.controller');
      const libraryEntryRepository = container.resolve('libraryEntryRepository');
      const anilistScheduleClient = container.resolve('anilistScheduleClient');

      return new ScheduleController(libraryEntryRepository, anilistScheduleClient);
    },
    {
      singleton: true,
      dependencies: ['libraryEntryRepository', 'anilistScheduleClient'],
    }
  );

  // Register Schedule Cron Service for anime airing notifications
  container.register(
    'scheduleCronService',
    (c: any) => {
      const { ScheduleCronService } = require('../../modules/schedule/schedule-cron.service');
      const notificationService = c.resolve('notificationService');
      const anilistScheduleClient = c.resolve('anilistScheduleClient');
      const libraryEntryRepository = c.resolve('libraryEntryRepository');

      return new ScheduleCronService(
        notificationService,
        anilistScheduleClient,
        libraryEntryRepository
      );
    },
    {
      singleton: true,
      dependencies: ['notificationService', 'anilistScheduleClient', 'libraryEntryRepository'],
    }
  );

  logger.info('[Loader] Schedule module registered');
};

export = loadSchedule;
