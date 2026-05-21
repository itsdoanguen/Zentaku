/**
 * Community Repository
 */

import type { Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/BaseRepository';
import type { Community } from '../../../entities/Community.entity';
import type { ICommunityRepository } from '../types/community.types';

export class CommunityRepository extends BaseRepository<Community> implements ICommunityRepository {
  constructor(repository: Repository<Community>) {
    super(repository);
  }

  async findCommunityById(communityId: bigint): Promise<Community | null> {
    return this.findOne({
      where: { id: communityId },
      relations: ['owner'],
    });
  }

  async createCommunity(data: Partial<Community>): Promise<Community> {
    return this.create(data);
  }

  async updateCommunity(communityId: bigint, data: Partial<Community>): Promise<Community> {
    const updated = await this.update(communityId, data);
    if (!updated) {
      throw new Error(`Failed to update community with ID ${communityId}`);
    }
    return updated;
  }

  async deleteCommunity(communityId: bigint): Promise<void> {
    await this.softDelete(communityId);
  }

  async findCommunityByInviteCode(inviteCode: string): Promise<Community | null> {
    return this.findOne({
      where: { inviteCode },
    });
  }

  async listCommunities(options: {
    page: number;
    perPage: number;
    q?: string;
    isPublic?: boolean;
    sortBy: 'createdAt' | 'membersCount' | 'name';
    sortOrder: 'asc' | 'desc';
  }): Promise<{ data: Community[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('community')
      .leftJoinAndSelect('community.owner', 'owner')
      .leftJoin('community.members', 'member')
      .select([
        'community.id',
        'community.ownerId',
        'community.name',
        'community.icon',
        'community.description',
        'community.isPublic',
        'community.inviteCode',
        'community.createdAt',
        'community.updatedAt',
        'owner.id',
        'owner.username',
      ])
      .addSelect('COUNT(member.userId)', 'membersCount')
      .groupBy('community.id')
      .addGroupBy('owner.id');

    if (options.q) {
      query.andWhere('community.name LIKE :q', { q: `%${options.q}%` });
    }

    if (options.isPublic !== undefined) {
      query.andWhere('community.isPublic = :isPublic', { isPublic: options.isPublic });
    }

    // Default TypeORM group by requires all selected fields grouped in SQL standard mode
    const sortOrderUpper = options.sortOrder.toUpperCase() as 'ASC' | 'DESC';
    if (options.sortBy === 'membersCount') {
      query.orderBy('membersCount', sortOrderUpper);
    } else if (options.sortBy === 'name') {
      query.orderBy('community.name', sortOrderUpper);
    } else {
      query.orderBy('community.createdAt', sortOrderUpper);
    }

    const skip = (options.page - 1) * options.perPage;
    query.offset(skip).limit(options.perPage);

    // Get raw results to resolve membersCount correctly and entities map
    const { entities, raw } = await query.getRawAndEntities();

    // Attach membersCount metadata or keep it in a structured way
    // For MVP, we can map membersCount back to entities via a custom property or returning a composite result
    const data = entities.map((entity) => {
      const rawItem = raw.find((r) => String(r.community_id) === String(entity.id));
      (entity as any).membersCount = rawItem ? Number(rawItem.membersCount) : 0;
      return entity;
    });

    // Run total count query separately for exact pagination metadata
    const countQuery = this.repository.createQueryBuilder('community');
    if (options.q) {
      countQuery.andWhere('community.name LIKE :q', { q: `%${options.q}%` });
    }
    if (options.isPublic !== undefined) {
      countQuery.andWhere('community.isPublic = :isPublic', { isPublic: options.isPublic });
    }
    const total = await countQuery.getCount();

    return { data, total };
  }
}
