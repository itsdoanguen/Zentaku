import logger from '../../shared/utils/logger';
import type { Container } from '../container';

const loadChannel = (container: Container): void => {
  if (!container.has('channelRepository')) {
    container.register(
      'channelRepository',
      (c: Container) => {
        const { Channel, ChannelParticipant } = require('../../entities');
        const {
          ChannelRepository,
        } = require('../../modules/channel/repositories/channel.repository');
        const dataSource = c.resolve('dataSource');
        const typeormChannelRepository = (dataSource as any).getRepository(Channel);
        const typeormParticipantRepository = (dataSource as any).getRepository(ChannelParticipant);

        return new ChannelRepository(typeormChannelRepository, typeormParticipantRepository);
      },
      {
        singleton: true,
        dependencies: ['dataSource'],
      }
    );
  }

  container.register(
    'channelService',
    (c: Container) => {
      const { ChannelService } = require('../../modules/channel/services/channel.service');
      const channelRepository = c.resolve('channelRepository');
      const communityRepository = c.resolve('communityRepository');
      const communityMemberRepository = c.resolve('communityMemberRepository');
      const userRepository = c.resolve('userRepository');

      return new ChannelService(
        channelRepository,
        communityRepository,
        communityMemberRepository,
        userRepository
      );
    },
    {
      singleton: true,
      dependencies: [
        'channelRepository',
        'communityRepository',
        'communityMemberRepository',
        'userRepository',
      ],
    }
  );

  container.register(
    'channelController',
    (c: Container) => {
      const ChannelController =
        require('../../modules/channel/controllers/channel.controller').default ||
        require('../../modules/channel/controllers/channel.controller');
      const channelService = c.resolve('channelService');
      return new ChannelController(channelService);
    },
    {
      singleton: true,
      dependencies: ['channelService'],
    }
  );

  logger.info('[Loader] Channel module registered');
};

export = loadChannel;
