import type { IBaseService } from '../../../core/base/BaseController';
import type { Channel } from '../../../entities/Channel.entity';
import type { ChannelParticipant } from '../../../entities/ChannelParticipant.entity';
import type { ChannelType } from '../../../entities/types/enums';

export interface CreateChannelDto {
  name: string;
  type: ChannelType;
  isPrivate?: boolean;
  position?: number;
}

export interface IChannelService extends IBaseService {
  createChannel(communityId: bigint, userId: bigint, data: CreateChannelDto): Promise<Channel>;
  listChannels(
    communityId: bigint,
    userId: bigint,
    options?: {
      includePrivate?: boolean;
    }
  ): Promise<Channel[]>;
  createOrGetPrivateChannel(userId: bigint, recipientId: bigint): Promise<Channel>;
  getChannelDetail(channelId: bigint, userId: bigint): Promise<Channel>;
  listPrivateChannels(userId: bigint): Promise<Channel[]>;
}

export interface IChannelRepository {
  findChannelById(channelId: bigint): Promise<Channel | null>;
  createChannel(data: Partial<Channel>): Promise<Channel>;
  listChannelsInCommunity(communityId: bigint): Promise<Channel[]>;
  findPrivateChannelBetweenUsers(userA: bigint, userB: bigint): Promise<Channel | null>;
  createPrivateChannel(userA: bigint, userB: bigint): Promise<Channel>;
  isParticipant(channelId: bigint, userId: bigint): Promise<boolean>;
  addParticipant(channelId: bigint, userId: bigint): Promise<ChannelParticipant>;
  findPrivateChannelsByUserId(userId: bigint): Promise<Channel[]>;
}
