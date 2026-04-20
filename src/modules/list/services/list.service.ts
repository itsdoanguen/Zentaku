/**
 * List Service
 *
 * Business logic layer for list operations
 */

import { BaseService } from '../../../core/base/BaseService';
import { type CustomList, type ListItem, PrivacyMode } from '../../../entities';
import { AnilistAPIError, NotFoundError } from '../../../shared/utils/error';
import type {
  AddMemberDto,
  CreateListDto,
  InviteMemberDto,
  ListDetailDto,
  ListMemberDto,
  ListRequestDto,
  ListSummaryDto,
  RequestEditDto,
  RequestJoinDto,
  RespondToRequestDto,
  SearchListDto,
  UpdateListDto,
  UpdateMemberPermissionDto,
  UpdateThemeDto,
} from '../dto/list.dto';
import type { IListRepository, IListService, ListSearchResult } from '../types/list.types';

export class ListService extends BaseService implements IListService {
  constructor(private readonly listRepository: IListRepository) {
    super();
  }

  private _notImplemented(method: string, context?: Record<string, unknown>): never {
    this.logWarn(`ListService.${method} is not implemented in phase 0`, {
      ...context,
      hasRepository: !!this.listRepository,
    });
    throw new Error(`Not implemented yet (phase 0): ${method}`);
  }

  private logWarn(message: string, meta: Record<string, unknown> = {}): void {
    this.logger.warn(`[${this.constructor.name}] ${message}`, meta);
  }

  private _validatePrivacy(privacy?: string): void {
    if (privacy && !['PUBLIC', 'PRIVATE', 'SHARED'].includes(privacy)) {
      throw new Error(`Invalid privacy mode: ${privacy}. Must be PUBLIC, PRIVATE, or SHARED`);
    }
  }

  private mapPrivacyMode(privacy?: 'PUBLIC' | 'PRIVATE' | 'SHARED'): PrivacyMode {
    const resolved = privacy || 'PUBLIC';
    const privacyMap: Record<'PUBLIC' | 'PRIVATE' | 'SHARED', PrivacyMode> = {
      PUBLIC: PrivacyMode.PUBLIC,
      PRIVATE: PrivacyMode.PRIVATE,
      SHARED: PrivacyMode.SHARED,
    };

    return privacyMap[resolved];
  }

  private toNumberId(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    return Number(String(value));
  }

  private toISODate(value: Date | string | null | undefined): string {
    if (!value) {
      return new Date(0).toISOString();
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return new Date(0).toISOString();
    }

    return date.toISOString();
  }

  private isOwner(list: CustomList, userId?: number): boolean {
    if (!userId) {
      return false;
    }

    return String(list.ownerId) === String(userId);
  }

  private assertCanViewList(list: CustomList, userId?: number): void {
    if (list.privacy === PrivacyMode.PUBLIC || this.isOwner(list, userId)) {
      return;
    }

    throw new AnilistAPIError('You do not have permission to view this list', 403, {
      listId: this.toNumberId(list.id),
      privacy: list.privacy,
    });
  }

  private mapListSummary(list: CustomList): ListSummaryDto {
    return {
      id: this.toNumberId(list.id),
      name: list.name,
      slug: list.slug,
      description: list.description || undefined,
      ownerUsername: list.owner?.username || '',
      privacy: list.privacy,
      bannerImage: list.bannerImage || undefined,
      likeCount: 0,
      itemCount: list.items?.length || 0,
    };
  }

  private mapAnimeItems(items: ListItem[] = []): ListDetailDto['animeItems'] {
    return items.map((item) => {
      const media = item.media;
      const mediaId = media ? this.toNumberId(media.id) : this.toNumberId(item.mediaId);
      const title =
        media?.titleEnglish || media?.titleRomaji || media?.titleNative || `Media #${mediaId}`;

      return {
        id: this.toNumberId(item.id),
        mediaId,
        title,
        poster: media?.coverImage || undefined,
        note: item.note || undefined,
        position: item.orderIndex,
        addedAt: this.toISODate(item.createdAt),
      };
    });
  }

  private mapListDetail(list: CustomList, userId?: number): ListDetailDto {
    const animeItems = this.mapAnimeItems(list.items || []);

    return {
      id: this.toNumberId(list.id),
      name: list.name,
      slug: list.slug,
      description: list.description || undefined,
      privacy: list.privacy,
      isOwner: this.isOwner(list, userId),
      ownerId: this.toNumberId(list.ownerId),
      ownerUsername: list.owner?.username || '',
      bannerImage: list.bannerImage || undefined,
      createdAt: this.toISODate(list.createdAt),
      updatedAt: this.toISODate(list.updatedAt),
      likeCount: 0,
      likedByMe: false,
      animeItems,
    };
  }

  // ==================== PHASE 1: CRUD ====================

  async createList(userId: number, data: CreateListDto) {
    this._validateId(userId, 'User ID');
    this._validateString(data.name, 'List name', { minLength: 1, maxLength: 255 });
    if (data.description) {
      this._validateString(data.description, 'Description', { maxLength: 5000 });
    }
    if (data.privacy) {
      this._validatePrivacy(data.privacy);
    }
    if (data.bannerImage) {
      this._validateString(data.bannerImage, 'Banner image URL', { minLength: 1 });
    }

    return this._executeWithErrorHandling(async () => {
      const slug = await this.listRepository.generateUniqueSlug(data.name);

      const created = await this.listRepository.createList({
        ownerId: BigInt(userId),
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        privacy: this.mapPrivacyMode(data.privacy),
        bannerImage: data.bannerImage?.trim() || null,
      });

      const hydrated = await this.listRepository.findListById(this.toNumberId(created.id));

      this._logInfo('List created', {
        listId: this.toNumberId(created.id),
        userId,
        slug,
      });

      return hydrated || created;
    }, 'createList');
  }

  async updateList(listId: number, userId: number, data: UpdateListDto) {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    if (data.name) {
      this._validateString(data.name, 'List name', { minLength: 1, maxLength: 255 });
    }
    if (data.description) {
      this._validateString(data.description, 'Description', { maxLength: 5000 });
    }
    if (data.privacy) {
      this._validatePrivacy(data.privacy);
    }
    if (data.bannerImage) {
      this._validateString(data.bannerImage, 'Banner image URL', { minLength: 1 });
    }

    return this._executeWithErrorHandling(async () => {
      const existing = await this.listRepository.findListById(listId);

      if (!existing) {
        throw new NotFoundError('List not found');
      }

      if (!this.isOwner(existing, userId)) {
        throw new AnilistAPIError('Only list owner can update this list', 403, { listId, userId });
      }

      const payload: Partial<CustomList> = {};

      if (data.name !== undefined) {
        payload.name = data.name.trim();
        payload.slug = await this.listRepository.generateUniqueSlug(data.name);
      }

      if (data.description !== undefined) {
        payload.description = data.description.trim() || null;
      }

      if (data.privacy !== undefined) {
        payload.privacy = this.mapPrivacyMode(data.privacy);
      }

      if (data.bannerImage !== undefined) {
        payload.bannerImage = data.bannerImage?.trim() || null;
      }

      if (Object.keys(payload).length === 0) {
        return existing;
      }

      const updated = await this.listRepository.updateList(listId, payload);

      this._logInfo('List updated', { listId, userId, fields: Object.keys(payload) });
      return updated;
    }, 'updateList');
  }

  async deleteList(listId: number, userId: number): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');

    await this._executeWithErrorHandling(async () => {
      const existing = await this.listRepository.findListById(listId);

      if (!existing) {
        throw new NotFoundError('List not found');
      }

      if (!this.isOwner(existing, userId)) {
        throw new AnilistAPIError('Only list owner can delete this list', 403, { listId, userId });
      }

      await this.listRepository.deleteList(listId);

      this._logInfo('List deleted', { listId, userId });
    }, 'deleteList');
  }

  async getListDetail(listId: number, userId?: number): Promise<ListDetailDto> {
    this._validateId(listId, 'List ID');

    return this._executeWithErrorHandling(async () => {
      const list = await this.listRepository.findListById(listId);

      if (!list) {
        throw new NotFoundError('List not found');
      }

      this.assertCanViewList(list, userId);

      return this.mapListDetail(list, userId);
    }, 'getListDetail');
  }

  async getUserLists(username: string, userId?: number): Promise<ListSummaryDto[]> {
    this._validateString(username, 'Username', { minLength: 1, maxLength: 255 });

    return this._executeWithErrorHandling(async () => {
      const lists = await this.listRepository.getListsByUsername(username.trim());

      const visibleLists = lists.filter((list) => {
        if (list.privacy === PrivacyMode.PUBLIC) {
          return true;
        }

        return this.isOwner(list, userId);
      });

      return visibleLists.map((list) => this.mapListSummary(list));
    }, 'getUserLists');
  }

  async getListAnimes(listId: number): Promise<ListItem[]> {
    this._validateId(listId, 'List ID');

    return this._executeWithErrorHandling(async () => {
      const list = await this.listRepository.findListById(listId);

      if (!list) {
        throw new NotFoundError('List not found');
      }

      if (list.privacy !== PrivacyMode.PUBLIC) {
        throw new AnilistAPIError('This list is private', 403, { listId, privacy: list.privacy });
      }

      return list.items || [];
    }, 'getListAnimes');
  }

  // ==================== PHASE 2: MEMBER MANAGEMENT ====================

  async listMembers(listId: number): Promise<ListMemberDto[]> {
    this._validateId(listId, 'List ID');
    return this._notImplemented('listMembers', { listId });
  }

  async addMember(listId: number, userId: number, data: AddMemberDto): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._notImplemented('addMember', { listId, userId, username: data.username });
  }

  async updateMemberPermission(
    listId: number,
    userId: number,
    data: UpdateMemberPermissionDto
  ): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._notImplemented('updateMemberPermission', { listId, userId, permission: data.permission });
  }

  async removeMember(listId: number, userId: number, username: string): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._validateString(username, 'Username', { minLength: 1, maxLength: 255 });
    this._notImplemented('removeMember', { listId, userId, username });
  }

  // ==================== PHASE 3: INVITES & REQUESTS ====================

  async inviteMember(listId: number, userId: number, data: InviteMemberDto): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._notImplemented('inviteMember', { listId, userId, username: data.username });
  }

  async requestJoin(listId: number, userId: number, data: RequestJoinDto): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._notImplemented('requestJoin', { listId, userId, hasMessage: !!data.message });
  }

  async requestEdit(listId: number, userId: number, data: RequestEditDto): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._notImplemented('requestEdit', { listId, userId, hasMessage: !!data.message });
  }

  async getListRequests(listId: number, userId: number): Promise<ListRequestDto[]> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    return this._notImplemented('getListRequests', { listId, userId });
  }

  async respondToRequest(
    listId: number,
    userId: number,
    requestId: number,
    data: RespondToRequestDto
  ): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._validateId(requestId, 'Request ID');
    this._notImplemented('respondToRequest', { listId, userId, requestId, action: data.action });
  }

  // ==================== PHASE 4: THEME & LIKES ====================

  async updateTheme(listId: number, userId: number, data: UpdateThemeDto): Promise<CustomList> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    return this._notImplemented('updateTheme', { listId, userId, themeKey: data.themeKey });
  }

  async toggleLike(listId: number, userId: number): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._notImplemented('toggleLike', { listId, userId });
  }

  async getLikeStatus(listId: number, userId: number): Promise<{ likedByMe: boolean }> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    return this._notImplemented('getLikeStatus', { listId, userId });
  }

  // ==================== PHASE 5: SEARCH ====================

  async searchLists(options: SearchListDto): Promise<ListSearchResult> {
    this._validateString(options.query, 'Query', { minLength: 1, maxLength: 255 });
    return this._notImplemented('searchLists', { ...options });
  }
}
