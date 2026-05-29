/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/BaseRepository';
import type { Channel } from '../../../entities/Channel.entity';
import type { ChannelParticipant } from '../../../entities/ChannelParticipant.entity';
import { ChannelType } from '../../../entities/types/enums';
import type { IChannelRepository } from '../types/channel.types';

export class ChannelRepository extends BaseRepository<Channel> implements IChannelRepository {
  constructor(
    repository: Repository<Channel>,
    private readonly participantRepository: Repository<ChannelParticipant>
  ) {
    super(repository);
  }

  async findChannelById(channelId: bigint): Promise<Channel | null> {
    return this.findOne({
      where: { id: channelId as any },
      relations: ['participants'],
    });
  }

  async createChannel(data: Partial<Channel>): Promise<Channel> {
    const channel = this.repository.create(data);
    return this.repository.save(channel);
  }

  async listChannelsInCommunity(communityId: bigint): Promise<Channel[]> {
    return this.repository.find({
      where: { communityId: communityId as any },
      order: {
        position: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  async findPrivateChannelBetweenUsers(userA: bigint, userB: bigint): Promise<Channel | null> {
    const qb = this.repository
      .createQueryBuilder('channel')
      .innerJoinAndSelect('channel.participants', 'p1')
      .innerJoinAndSelect('channel.participants', 'p2')
      .where('channel.communityId IS NULL')
      .andWhere('channel.type = :type', { type: ChannelType.TEXT })
      .andWhere('channel.isPrivate = :isPrivate', { isPrivate: true })
      .andWhere('p1.userId = :userA', { userA })
      .andWhere('p2.userId = :userB', { userB });

    return qb.getOne();
  }

  async createPrivateChannel(userA: bigint, userB: bigint): Promise<Channel> {
    const channel = this.repository.create({
      communityId: null,
      type: ChannelType.TEXT,
      isPrivate: true,
      name: null,
      position: 0,
    });

    const savedChannel = await this.repository.save(channel);

    await this.addParticipant(savedChannel.id, userA);
    await this.addParticipant(savedChannel.id, userB);

    return this.findChannelById(savedChannel.id) as Promise<Channel>;
  }

  async findPrivateChannelsByUserId(userId: bigint): Promise<Channel[]> {
    return this.repository
      .createQueryBuilder('channel')
      .innerJoin('channel.participants', 'me', 'me.userId = :userId', { userId })
      .leftJoinAndSelect(
        'channel.participants',
        'otherParticipant',
        'otherParticipant.userId != :userId',
        { userId }
      )
      .leftJoinAndSelect('otherParticipant.user', 'otherUser')
      .where('channel.communityId IS NULL')
      .andWhere('channel.type = :type', { type: ChannelType.TEXT })
      .andWhere('channel.isPrivate = :isPrivate', { isPrivate: true })
      .orderBy('channel.createdAt', 'DESC')
      .getMany();
  }

  async isParticipant(channelId: bigint, userId: bigint): Promise<boolean> {
    const count = await this.participantRepository.count({
      where: {
        channelId: channelId as any,
        userId: userId as any,
      },
    });
    return count > 0;
  }

  async addParticipant(channelId: bigint, userId: bigint): Promise<ChannelParticipant> {
    const participant = this.participantRepository.create({
      channelId,
      userId,
      isMuted: false,
    });
    return this.participantRepository.save(participant);
  }
}
