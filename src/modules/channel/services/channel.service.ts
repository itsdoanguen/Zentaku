import { BaseService } from '../../../core/base/BaseService';
import type { Channel } from '../../../entities/Channel.entity';
import { UserRole } from '../../../entities/types/enums';
import { NotFoundError, ValidationError } from '../../../shared/utils/error';
import type {
  ICommunityMemberRepository,
  ICommunityRepository,
} from '../../community/types/community.types';
import { ChatMessageModel } from '../../message/repositories/message.schema';
import type { IUserRepository } from '../../user/repositories/user.repository';
import type { CreateChannelDto, IChannelRepository, IChannelService } from '../types/channel.types';

export class ChannelService extends BaseService implements IChannelService {
  constructor(
    private readonly channelRepository: IChannelRepository,
    private readonly communityRepository: ICommunityRepository,
    private readonly communityMemberRepository: ICommunityMemberRepository,
    private readonly userRepository: IUserRepository
  ) {
    super();
  }

  async createChannel(
    communityId: bigint,
    userId: bigint,
    data: CreateChannelDto
  ): Promise<Channel> {
    const community = await this.communityRepository.findCommunityById(communityId);
    if (!community) {
      throw new NotFoundError('Community not found');
    }

    // Check membership and permissions
    const member = await this.communityMemberRepository.findMember(communityId, userId);
    if (!member) {
      throw new ValidationError('Access denied to this community');
    }

    const isOwner = String(community.ownerId) === String(userId);
    const isAdmin = member.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ValidationError('Only community owner or administrator can create channels');
    }

    this._validateString(data.name, 'Channel name', { minLength: 1, maxLength: 100 });

    const channel = await this.channelRepository.createChannel({
      communityId,
      name: data.name,
      type: data.type,
      isPrivate: data.isPrivate ?? false,
      position: data.position ?? 0,
    });

    return channel;
  }

  async listChannels(
    communityId: bigint,
    userId: bigint,
    _options?: { includePrivate?: boolean }
  ): Promise<Channel[]> {
    const community = await this.communityRepository.findCommunityById(communityId);
    if (!community) {
      throw new NotFoundError('Community not found');
    }

    const member = await this.communityMemberRepository.findMember(communityId, userId);

    if (!community.isPublic && !member) {
      throw new ValidationError('Access denied to this private community');
    }

    const channels = await this.channelRepository.listChannelsInCommunity(communityId);

    // If user is a member of the community, they can see private channels.
    // If user is NOT a member, they can ONLY see public channels (isPrivate = false).
    if (!member) {
      return channels.filter((c) => !c.isPrivate);
    }

    return channels;
  }

  async createOrGetPrivateChannel(userId: bigint, recipientId: bigint): Promise<Channel> {
    if (String(userId) === String(recipientId)) {
      throw new ValidationError('Cannot create a direct message channel with yourself');
    }

    const recipient = await this.userRepository.findById(recipientId);
    if (!recipient) {
      throw new NotFoundError('Recipient user not found');
    }

    // Check if channel already exists
    const existingChannel = await this.channelRepository.findPrivateChannelBetweenUsers(
      userId,
      recipientId
    );
    if (existingChannel) {
      return existingChannel;
    }

    // Create a new private channel
    return this.channelRepository.createPrivateChannel(userId, recipientId);
  }

  async getChannelDetail(channelId: bigint, userId: bigint): Promise<Channel> {
    const channel = await this.channelRepository.findChannelById(channelId);
    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    if (channel.communityId) {
      // It is a community channel
      const community = await this.communityRepository.findCommunityById(channel.communityId);
      if (!community) {
        throw new NotFoundError('Community not found');
      }

      const member = await this.communityMemberRepository.findMember(channel.communityId, userId);

      // Security checks
      if (channel.isPrivate) {
        if (!member) {
          throw new ValidationError('Access denied to this private channel');
        }
      } else {
        // Public channel
        if (!community.isPublic && !member) {
          throw new ValidationError('Access denied to this private community');
        }
      }
    } else {
      // It is a private DM channel
      const isPart = await this.channelRepository.isParticipant(channelId, userId);
      if (!isPart) {
        throw new ValidationError('Access denied to this direct message channel');
      }
    }

    return channel;
  }

  async listPrivateChannels(userId: bigint): Promise<Channel[]> {
    const channels = await this.channelRepository.findPrivateChannelsByUserId(userId);

    const lastMessageIds = channels
      .filter((ch: any) => ch.lastMessage?.id)
      .map((ch: any) => String(ch.lastMessage.id));

    if (lastMessageIds.length > 0) {
      const messages = await ChatMessageModel.find({ _id: { $in: lastMessageIds } }).lean();
      const messageMap = new Map();
      messages.forEach((m: any) => messageMap.set(String(m._id), m));

      channels.forEach((ch: any) => {
        if (ch.lastMessage?.id) {
          const mongoMsg = messageMap.get(String(ch.lastMessage.id));
          if (mongoMsg) {
            ch.lastMessage.content = mongoMsg.content;
            ch.lastMessage.attachments = mongoMsg.attachments;
            // Ensure createdAt from MongoDB is used if more accurate
            if (mongoMsg.createdAt) {
              ch.lastMessage.createdAt = mongoMsg.createdAt;
            }
          }
        }
      });
    }

    return channels;
  }
}
