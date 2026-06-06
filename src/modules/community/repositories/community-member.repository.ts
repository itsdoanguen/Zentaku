/**
 * Community Member Repository
 */

import type { Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/BaseRepository';
import type { CommunityMember } from '../../../entities/CommunityMember.entity';
import { UserRole } from '../../../entities/types/enums';
import type { ICommunityMemberRepository } from '../types/community.types';

export class CommunityMemberRepository
  extends BaseRepository<CommunityMember>
  implements ICommunityMemberRepository
{
  constructor(repository: Repository<CommunityMember>) {
    super(repository);
  }

  async findMember(communityId: bigint, userId: bigint): Promise<CommunityMember | null> {
    return this.findOne({
      where: {
        communityId: communityId as any,
        userId: userId as any,
      },
      relations: ['user'],
    });
  }

  async addMember(
    communityId: bigint,
    userId: bigint,
    role: UserRole = UserRole.MEMBER
  ): Promise<CommunityMember> {
    const member = this.repository.create({
      communityId,
      userId,
      role,
      joinedAt: new Date(),
    });
    return this.repository.save(member);
  }

  async removeMember(communityId: bigint, userId: bigint): Promise<void> {
    await this.repository.delete({
      communityId: communityId as any,
      userId: userId as any,
    });
  }

  async updateMemberRole(
    communityId: bigint,
    userId: bigint,
    role: UserRole
  ): Promise<CommunityMember> {
    await this.repository.update(
      {
        communityId: communityId as any,
        userId: userId as any,
      },
      { role }
    );
    const updated = await this.findMember(communityId, userId);
    if (!updated) {
      throw new Error(
        `Failed to update member role for community ${communityId} and user ${userId}`
      );
    }
    return updated;
  }

  async countMembers(communityId: bigint): Promise<number> {
    return this.count({ communityId: communityId as any });
  }

  async listMembers(communityId: bigint): Promise<CommunityMember[]> {
    return this.repository.find({
      where: { communityId: communityId as any },
      relations: ['user'],
    });
  }

  async updateMemberMute(
    communityId: bigint,
    userId: bigint,
    isMuted: boolean
  ): Promise<CommunityMember> {
    await this.repository.update(
      {
        communityId: communityId as any,
        userId: userId as any,
      },
      { isMuted }
    );
    const updated = await this.findMember(communityId, userId);
    if (!updated) {
      throw new Error(
        `Failed to update member mute for community ${communityId} and user ${userId}`
      );
    }
    return updated;
  }
}
