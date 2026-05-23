import { MessageService } from '../services/message.service';
import type { IMessageRepository } from '../types/message.types';
import type { IChannelRepository } from '../../channel/types/channel.types';
import type { ICommunityRepository, ICommunityMemberRepository } from '../../community/types/community.types';
import { ChannelType, UserRole } from '../../../entities/types/enums';
import { NotFoundError, ValidationError } from '../../../shared/utils/error';
import type { Channel } from '../../../entities/Channel.entity';
import type { Community } from '../../../entities/Community.entity';
import type { CommunityMember } from '../../../entities/CommunityMember.entity';
import type { Message as SQLMessage } from '../../../entities/Message.entity';
import type { ChannelParticipant } from '../../../entities/ChannelParticipant.entity';

describe('MessageService', () => {
  let messageService: MessageService;
  let mockMessageRepository: jest.Mocked<IMessageRepository>;
  let mockChannelRepository: jest.Mocked<IChannelRepository>;
  let mockCommunityRepository: jest.Mocked<ICommunityRepository>;
  let mockCommunityMemberRepository: jest.Mocked<ICommunityMemberRepository>;

  beforeEach(() => {
    mockMessageRepository = {
      appendMessage: jest.fn(),
      fetchHistory: jest.fn(),
      updateReadCursor: jest.fn(),
    } as any;

    mockChannelRepository = {
      findChannelById: jest.fn(),
      isParticipant: jest.fn(),
    } as any;

    mockCommunityRepository = {
      findCommunityById: jest.fn(),
    } as any;

    mockCommunityMemberRepository = {
      findMember: jest.fn(),
    } as any;

    messageService = new MessageService(
      mockMessageRepository,
      mockChannelRepository,
      mockCommunityRepository,
      mockCommunityMemberRepository
    );
  });

  describe('sendMessage', () => {
    const channelId = BigInt(100);
    const userId = BigInt(1);
    const dto = { content: 'Hello World', replyToId: null, attachments: [] };

    it('should successfully send a message in a public community channel', async () => {
      const channel = { id: channelId, communityId: BigInt(10), isPrivate: false } as Channel;
      const community = { id: BigInt(10), isPublic: true } as Community;
      const member = { communityId: BigInt(10), userId, role: UserRole.MEMBER } as CommunityMember;
      const savedSqlMsg = { id: BigInt(1000), createdAt: new Date() } as SQLMessage;

      mockChannelRepository.findChannelById.mockResolvedValueOnce(channel);
      mockCommunityRepository.findCommunityById.mockResolvedValueOnce(community);
      mockCommunityMemberRepository.findMember.mockResolvedValueOnce(member);
      mockMessageRepository.appendMessage.mockResolvedValueOnce(savedSqlMsg);

      const result = await messageService.sendMessage(channelId, userId, dto);

      expect(result.content).toBe(dto.content);
      expect(result.id).toBe('1000');
      expect(mockMessageRepository.appendMessage).toHaveBeenCalledWith({
        channelId,
        senderId: userId,
        replyToId: null,
        content: dto.content,
        attachments: [],
      });
    });

    it('should throw NotFoundError if channel does not exist', async () => {
      mockChannelRepository.findChannelById.mockResolvedValueOnce(null);

      await expect(messageService.sendMessage(channelId, userId, dto)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if user is not participant in direct message channel', async () => {
      const channel = { id: channelId, communityId: null, isPrivate: true } as Channel;

      mockChannelRepository.findChannelById.mockResolvedValueOnce(channel);
      mockChannelRepository.isParticipant.mockResolvedValueOnce(false);

      await expect(messageService.sendMessage(channelId, userId, dto)).rejects.toThrow(ValidationError);
    });
  });

  describe('getMessageHistory', () => {
    const channelId = BigInt(100);
    const userId = BigInt(1);

    it('should retrieve message history successfully and build cursor', async () => {
      const channel = { id: channelId, communityId: BigInt(10), isPrivate: false } as Channel;
      const community = { id: BigInt(10), isPublic: true } as Community;
      const member = { communityId: BigInt(10), userId, role: UserRole.MEMBER } as CommunityMember;
      
      const mockDocs = [
        { _id: '1001', channelId: '100', senderId: '1', content: 'Msg 1', createdAt: new Date('2026-05-23T10:00:00Z') },
        { _id: '1002', channelId: '100', senderId: '2', content: 'Msg 2', createdAt: new Date('2026-05-23T10:01:00Z') },
      ];

      mockChannelRepository.findChannelById.mockResolvedValueOnce(channel);
      mockCommunityRepository.findCommunityById.mockResolvedValueOnce(community);
      mockCommunityMemberRepository.findMember.mockResolvedValueOnce(member);
      mockMessageRepository.fetchHistory.mockResolvedValueOnce(mockDocs);

      const result = await messageService.getMessageHistory(channelId, userId, { limit: 1 });

      // Pop item since limit=1 and docs=2 (hasMore=true)
      expect(result.items.length).toBe(1);
      expect(result.items[0]!.id).toBe('1001');
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).not.toBeNull();
    });
  });

  describe('updateReadCursor', () => {
    const channelId = BigInt(100);
    const userId = BigInt(1);
    const lastReadMessageId = BigInt(1001);

    it('should successfully update read cursor', async () => {
      const channel = { id: channelId, communityId: null, isPrivate: true } as Channel;
      const participant = { channelId, userId, lastReadAt: new Date() } as ChannelParticipant;

      mockChannelRepository.findChannelById.mockResolvedValueOnce(channel);
      mockChannelRepository.isParticipant.mockResolvedValueOnce(true);
      mockMessageRepository.updateReadCursor.mockResolvedValueOnce(participant);

      const result = await messageService.updateReadCursor(channelId, userId, lastReadMessageId);

      expect(result.channelId).toBe('100');
      expect(result.userId).toBe('1');
      expect(result.lastReadMessageId).toBe('1001');
      expect(mockMessageRepository.updateReadCursor).toHaveBeenCalledWith(channelId, userId, lastReadMessageId);
    });
  });
});
