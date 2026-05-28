/**
 * List Repository
 *
 * Data access layer for list operations
 */

import { BaseRepository } from '../../../core/base/BaseRepository';
import type { CustomList } from '../../../entities/CustomList.entity';
import type { Repository } from 'typeorm';
import type { IListRepository } from '../types/list.types';

export class ListRepository extends BaseRepository<CustomList> implements IListRepository {
  constructor(repository: Repository<CustomList>) {
    super(repository);
  }

  private readonly colorPalette = new Set([
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#3F51B5',
    '#2196F3',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#FFC107',
    '#FF9800',
    '#795548',
  ]);

  private toEntityId(id: number): bigint {
    return BigInt(id);
  }

  private normalizeSlug(input: string): string {
    const normalized = input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');

    return normalized || 'list';
  }

  // ==================== PHASE 1: CRUD ====================

  async findListById(listId: number): Promise<CustomList | null> {
    return this.repository.findOne({
      where: { id: this.toEntityId(listId) },
      relations: ['owner', 'items', 'items.media', 'items.addedBy'],
      order: {
        items: {
          orderIndex: 'ASC',
          createdAt: 'ASC',
        },
      },
    });
  }

  async createList(data: Partial<CustomList>): Promise<CustomList> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async updateList(listId: number, data: Partial<CustomList>): Promise<CustomList> {
    await this.repository.update({ id: this.toEntityId(listId) }, data as any);

    const updated = await this.findListById(listId);
    if (!updated) {
      throw new Error(`List ${listId} not found after update`);
    }

    return updated;
  }

  async deleteList(listId: number): Promise<void> {
    await this.repository.softDelete({ id: this.toEntityId(listId) });
  }

  async getUserLists(userId: number): Promise<CustomList[]> {
    return this.repository.find({
      where: { ownerId: this.toEntityId(userId) },
      relations: ['owner', 'items'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getListBySlug(slug: string): Promise<CustomList | null> {
    return this.repository.findOne({
      where: { slug },
      relations: ['owner', 'items', 'items.media', 'items.addedBy'],
      order: {
        items: {
          orderIndex: 'ASC',
          createdAt: 'ASC',
        },
      },
    });
  }

  async getListsByUsername(username: string): Promise<CustomList[]> {
    return this.repository
      .createQueryBuilder('list')
      .innerJoinAndSelect('list.owner', 'owner')
      .leftJoinAndSelect('list.items', 'items')
      .where('owner.username = :username', { username })
      .orderBy('list.updatedAt', 'DESC')
      .getMany();
  }

  // ==================== HELPER: Slug generation ====================

  /**
   * Generate unique slug from list name
   * slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
   * If duplicate exists, append counter (try -1, -2, etc.)
   */
  async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.normalizeSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Include soft-deleted lists because slug has a unique DB constraint.
    while (true) {
      const exists = await this.repository
        .createQueryBuilder('list')
        .withDeleted()
        .select('list.id')
        .where('list.slug = :slug', { slug })
        .getOne();

      if (!exists) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  /**
   * Validate color is in whitelist palette
   */
  isValidColor(color: string): boolean {
    return this.colorPalette.has(color.toUpperCase());
  }
}
