import * as crypto from 'crypto';
import { BaseService } from '../../../core/base/BaseService';
import type { Community } from '../../../entities/Community.entity';
import type { CommunityMember } from '../../../entities/CommunityMember.entity';
import { UserRole } from '../../../entities/types/enums';
import { NotFoundError, ValidationError } from '../../../shared/utils/error';
import type {
  CreateCommunityDto,
  ICommunityMemberRepository,
  ICommunityRepository,
  ICommunityService,
  PaginatedCommunitiesDto,
  UpdateCommunityDto,
} from '../types/community.types';

export class CommunityService extends BaseService implements ICommunityService {
  constructor(
    private readonly communityRepository: ICommunityRepository,
    private readonly communityMemberRepository: ICommunityMemberRepository
  ) {
    super();
  }

  private generateInviteCode(): string {
    return crypto.randomBytes(5).toString('hex').toUpperCase();
  }

  async createCommunity(userId: bigint, data: CreateCommunityDto): Promise<Community> {
    this._validateString(data.name, 'Community name', { minLength: 3, maxLength: 255 });
    if (data.description) {
      this._validateString(data.description, 'Description', { maxLength: 1000 });
    }

    let inviteCode = this.generateInviteCode();
    // Ensure uniqueness
    let exists = await this.communityRepository.findCommunityByInviteCode(inviteCode);
    while (exists) {
      inviteCode = this.generateInviteCode();
      exists = await this.communityRepository.findCommunityByInviteCode(inviteCode);
    }

    const community = await this.communityRepository.createCommunity({
      ownerId: userId,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      inviteCode,
    });

    // Add creator as the first member with ADMIN role
    await this.communityMemberRepository.addMember(community.id, userId, UserRole.ADMIN);

    return community;
  }

  async updateCommunity(
    communityId: bigint,
    userId: bigint,
    data: UpdateCommunityDto
  ): Promise<Community> {
    const community = await this.communityRepository.findCommunityById(communityId);
    if (!community) {
      throw new NotFoundError('Community not found');
    }

    if (String(community.ownerId) !== String(userId)) {
      throw new ValidationError('Only the owner can update the community details');
    }

    const updateData: Partial<Community> = {};
    if (data.name !== undefined) {
      this._validateString(data.name, 'Community name', { minLength: 3, maxLength: 255 });
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      if (data.description !== null) {
        this._validateString(data.description, 'Description', { maxLength: 1000 });
      }
      updateData.description = data.description;
    }
    if (data.isPublic !== undefined) {
      updateData.isPublic = data.isPublic;
    }
    if (data.icon !== undefined) {
      updateData.icon = data.icon === '' ? null : (data.icon as any);
    }

    return this.communityRepository.updateCommunity(communityId, updateData);
  }

  async deleteCommunity(communityId: bigint, userId: bigint): Promise<void> {
    const community = await this.communityRepository.findCommunityById(communityId);
    if (!community) {
      throw new NotFoundError('Community not found');
    }

    if (String(community.ownerId) !== String(userId)) {
      throw new ValidationError('Only the owner can delete this community');
    }

    await this.communityRepository.deleteCommunity(communityId);
  }

  async getCommunityDetail(communityId: bigint, userId: bigint): Promise<Community> {
    const community = await this.communityRepository.findCommunityById(communityId);
    if (!community) {
      throw new NotFoundError('Community not found');
    }

    if (!community.isPublic) {
      const isMember = await this.communityMemberRepository.findMember(communityId, userId);
      if (!isMember) {
        throw new ValidationError('Access denied to this private community');
      }
    }

    return community;
  }

  async listCommunities(options: {
    page?: number;
    perPage?: number;
    q?: string;
    isPublic?: boolean;
    sortBy?: 'createdAt' | 'membersCount' | 'name';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedCommunitiesDto> {
    const page = options.page ?? 1;
    const perPage = options.perPage ?? 20;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder ?? 'desc';

    const { data, total } = await this.communityRepository.listCommunities({
      page,
      perPage,
      q: options.q,
      isPublic: options.isPublic,
      sortBy,
      sortOrder,
    });

    const totalPages = Math.ceil(total / perPage);

    const items = data.map((community) => ({
      id: String(community.id),
      name: community.name,
      description: community.description ?? null,
      icon: community.icon ?? null,
      isPublic: community.isPublic,
      inviteCode: community.inviteCode ?? null,
      ownerId: String(community.ownerId),
      createdAt: community.createdAt.toISOString(),
      membersCount: (community as any).membersCount || 0,
    }));

    return {
      items,
      page,
      perPage,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async joinCommunity(userId: bigint, inviteCode: string): Promise<CommunityMember> {
    const community = await this.communityRepository.findCommunityByInviteCode(inviteCode);
    if (!community) {
      throw new NotFoundError('Community not found with the provided invite code');
    }

    const existingMember = await this.communityMemberRepository.findMember(community.id, userId);
    if (existingMember) {
      throw new ValidationError('You are already a member of this community');
    }

    return this.communityMemberRepository.addMember(community.id, userId, UserRole.MEMBER);
  }

  async leaveCommunity(userId: bigint, communityId: bigint): Promise<void> {
    const community = await this.communityRepository.findCommunityById(communityId);
    if (!community) {
      throw new NotFoundError('Community not found');
    }

    if (String(community.ownerId) === String(userId)) {
      throw new ValidationError(
        'The owner cannot leave the community. Delete the community instead.'
      );
    }

    const member = await this.communityMemberRepository.findMember(communityId, userId);
    if (!member) {
      throw new ValidationError('You are not a member of this community');
    }

    await this.communityMemberRepository.removeMember(communityId, userId);
  }

  async getMemberRole(communityId: bigint, userId: bigint): Promise<UserRole | null> {
    const member = await this.communityMemberRepository.findMember(communityId, userId);
    return member ? member.role : null;
  }

  async toggleMute(
    userId: bigint,
    communityId: bigint,
    isMuted: boolean
  ): Promise<CommunityMember> {
    const member = await this.communityMemberRepository.findMember(communityId, userId);
    if (!member) {
      throw new ValidationError('You are not a member of this community');
    }
    return this.communityMemberRepository.updateMemberMute(communityId, userId, isMuted);
  }
}
