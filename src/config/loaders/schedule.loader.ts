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

  logger.info('[Loader] Schedule module registered');
};

export = loadSchedule;
