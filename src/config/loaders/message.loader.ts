import logger from '../../shared/utils/logger';
import type { Container } from '../container';

const loadMessage = (container: Container): void => {
  if (!container.has('messageRepository')) {
    container.register(
      'messageRepository',
      (c: Container) => {
        const { Message, ChannelParticipant } = require('../../entities');
        const {
          MessageRepository,
        } = require('../../modules/message/repositories/message.repository');
        const dataSource = c.resolve('dataSource');
        const typeormMessageRepository = (dataSource as any).getRepository(Message);
        const typeormParticipantRepository = (dataSource as any).getRepository(ChannelParticipant);

        return new MessageRepository(typeormMessageRepository, typeormParticipantRepository);
      },
      {
        singleton: true,
        dependencies: ['dataSource'],
      }
    );
  }

  container.register(
    'messageService',
    (c: Container) => {
      const { MessageService } = require('../../modules/message/services/message.service');
      const messageRepository = c.resolve('messageRepository');
      const channelRepository = c.resolve('channelRepository');
      const communityRepository = c.resolve('communityRepository');
      const communityMemberRepository = c.resolve('communityMemberRepository');

      return new MessageService(
        messageRepository,
        channelRepository,
        communityRepository,
        communityMemberRepository
      );
    },
    {
      singleton: true,
      dependencies: [
        'messageRepository',
        'channelRepository',
        'communityRepository',
        'communityMemberRepository',
      ],
    }
  );

  container.register(
    'messageController',
    (c: Container) => {
      const MessageController =
        require('../../modules/message/controllers/message.controller').default ||
        require('../../modules/message/controllers/message.controller');
      const messageService = c.resolve('messageService');
      return new MessageController(messageService);
    },
    {
      singleton: true,
      dependencies: ['messageService'],
    }
  );

  logger.info('[Loader] Message module registered');
};

export = loadMessage;
