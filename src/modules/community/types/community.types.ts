/**
 * Community Module Types
 */

import type { IBaseService } from '../../../core/base/BaseController';
import type { Community } from '../../../entities/Community.entity';
import type { CommunityMember } from '../../../entities/CommunityMember.entity';
import type { UserRole } from '../../../entities/types/enums';

export interface CreateCommunityDto {
  name: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface UpdateCommunityDto {
  name?: string;
  description?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface CommunitySummaryDto {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isPublic: boolean;
  inviteCode: string | null;
  ownerId: string;
  createdAt: string;
}

export interface PaginatedCommunitiesDto {
  items: CommunitySummaryDto[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface JoinCommunityDto {
  inviteCode: string;
}

export interface ICommunityService extends IBaseService {
  createCommunity(userId: bigint, data: CreateCommunityDto): Promise<Community>;
  updateCommunity(
    communityId: bigint,
    userId: bigint,
    data: UpdateCommunityDto
  ): Promise<Community>;
  deleteCommunity(communityId: bigint, userId: bigint): Promise<void>;
  getCommunityDetail(communityId: bigint, userId: bigint): Promise<Community>;
  listCommunities(options: {
    page?: number;
    perPage?: number;
    q?: string;
    isPublic?: boolean;
    sortBy?: 'createdAt' | 'membersCount' | 'name';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedCommunitiesDto>;
  joinCommunity(userId: bigint, inviteCode: string): Promise<CommunityMember>;
  leaveCommunity(userId: bigint, communityId: bigint): Promise<void>;
  getCommunityMembers(communityId: bigint, userId?: bigint): Promise<CommunityMember[]>;
  getMemberRole(communityId: bigint, userId: bigint): Promise<UserRole | null>;
  toggleMute(userId: bigint, communityId: bigint, isMuted: boolean): Promise<CommunityMember>;
  updateMemberRole(communityId: bigint, userId: bigint, role: UserRole): Promise<CommunityMember>;
}

export interface ICommunityRepository {
  findCommunityById(communityId: bigint): Promise<Community | null>;
  createCommunity(data: Partial<Community>): Promise<Community>;
  updateCommunity(communityId: bigint, data: Partial<Community>): Promise<Community>;
  deleteCommunity(communityId: bigint): Promise<void>;
  findCommunityByInviteCode(inviteCode: string): Promise<Community | null>;
  listCommunities(options: {
    page: number;
    perPage: number;
    q?: string;
    isPublic?: boolean;
    sortBy: 'createdAt' | 'membersCount' | 'name';
    sortOrder: 'asc' | 'desc';
  }): Promise<{ data: Community[]; total: number }>;
}

export interface ICommunityMemberRepository {
  findMember(communityId: bigint, userId: bigint): Promise<CommunityMember | null>;
  addMember(communityId: bigint, userId: bigint, role?: UserRole): Promise<CommunityMember>;
  removeMember(communityId: bigint, userId: bigint): Promise<void>;
  updateMemberRole(communityId: bigint, userId: bigint, role: UserRole): Promise<CommunityMember>;
  updateMemberMute(communityId: bigint, userId: bigint, isMuted: boolean): Promise<CommunityMember>;
  countMembers(communityId: bigint): Promise<number>;
  listMembers(communityId: bigint): Promise<CommunityMember[]>;
}
