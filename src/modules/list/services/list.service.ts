/**
 * List Service
 *
 * Business logic layer for list operations
 */

import { BaseService } from '../../../core/base/BaseService';
import {
  type CustomList,
  ListInvitation,
  ListItem,
  type User,
  InviteStatus,
  ListPermission,
  PrivacyMode,
} from '../../../entities';
import { AnilistAPIError, NotFoundError, ValidationError } from '../../../shared/utils/error';
import type AnimeRepository from '../../anime/anime.repository';
import type { IUserRepository } from '../../user/repositories/user.repository';
import type {
  AddMemberDto,
  CreateListDto,
  AddAnimeToListDto,
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
  constructor(
    private readonly listRepository: IListRepository,
    private readonly userRepository: IUserRepository,
    private readonly animeRepository: AnimeRepository
  ) {
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

  private getInvitationRepository() {
    return this.listRepository.getRepository().manager.getRepository(ListInvitation);
  }

  private getListItemRepository() {
    return this.listRepository.getRepository().manager.getRepository(ListItem);
  }

  private normalizeRequestAction(action: string): InviteStatus {
    const normalized = String(action).trim().toUpperCase();

    if (normalized === 'ACCEPT' || normalized === 'APPROVE') {
      return InviteStatus.ACCEPTED;
    }

    if (normalized === 'REJECT' || normalized === 'DECLINE') {
      return InviteStatus.DECLINED;
    }

    throw new ValidationError('Action must be ACCEPT or REJECT');
  }

  private mapRequestStatus(status: InviteStatus): 'pending' | 'approved' | 'rejected' {
    if (status === InviteStatus.ACCEPTED) {
      return 'approved';
    }

    if (status === InviteStatus.DECLINED) {
      return 'rejected';
    }

    return 'pending';
  }

  private mapRequestType(permission: ListPermission): 'join' | 'edit_permission' {
    return permission === ListPermission.EDITOR ? 'edit_permission' : 'join';
  }

  private mapRequestDto(invitation: ListInvitation): ListRequestDto | null {
    if (!invitation.invitee) {
      return null;
    }

    const requestType = this.mapRequestType(invitation.permission);
    const requestedAt = this.toISODate(invitation.createdAt);

    return {
      id: this.toNumberId(invitation.id),
      request_id: this.toNumberId(invitation.id),
      userId: this.toNumberId(invitation.inviteeId),
      username: invitation.invitee.username,
      requestType: requestType === 'edit_permission' ? 'EDIT' : 'JOIN',
      request_type: requestType,
      status: this.mapRequestStatus(invitation.status),
      status_code: invitation.status,
      message: undefined,
      requestedAt,
      requested_at: requestedAt,
      permissionLevel: invitation.permission,
      permission_level: invitation.permission === ListPermission.EDITOR ? 'edit' : 'view',
      can_edit: invitation.permission === ListPermission.EDITOR,
    };
  }

  private resolveMemberPermission(
    data: Pick<
      AddMemberDto | UpdateMemberPermissionDto,
      'permission' | 'can_edit' | 'permission_level'
    >
  ): ListPermission {
    if (data.permission_level) {
      if (['owner'].includes(data.permission_level)) {
        throw new ValidationError('Owner role cannot be assigned through member permission');
      }

      if (['edit'].includes(data.permission_level)) {
        return ListPermission.EDITOR;
      }

      if (['view', 'viewer'].includes(data.permission_level)) {
        return ListPermission.VIEWER;
      }
    }

    if (data.permission) {
      return data.permission === 'EDITOR' ? ListPermission.EDITOR : ListPermission.VIEWER;
    }

    if (typeof data.can_edit === 'boolean') {
      return data.can_edit ? ListPermission.EDITOR : ListPermission.VIEWER;
    }

    throw new ValidationError('Member permission is required');
  }

  private mapMemberPermissionLevel(
    permission: ListPermission,
    isOwner: boolean
  ): 'owner' | 'edit' | 'view' | 'viewer' {
    if (isOwner) {
      return 'owner';
    }

    return permission === ListPermission.EDITOR ? 'edit' : 'view';
  }

  private mapMemberDto(
    user: User,
    permission: ListPermission,
    isOwner: boolean,
    joinedAt: Date
  ): ListMemberDto {
    const displayName = user.displayName || user.username;
    const permissionLevel = this.mapMemberPermissionLevel(permission, isOwner);

    return {
      userId: this.toNumberId(user.id),
      username: user.username,
      displayName,
      avatar: user.avatar || undefined,
      permissionLevel: permission === ListPermission.EDITOR ? 'EDITOR' : 'VIEWER',
      isOwner,
      joinedAt: this.toISODate(joinedAt),
      can_edit: isOwner || permission === ListPermission.EDITOR,
      permission_level: permissionLevel,
      avatar_url: user.avatar || undefined,
      is_owner: isOwner,
    };
  }

  private async findListOrThrow(listId: number): Promise<CustomList> {
    const list = await this.listRepository.findListById(listId);

    if (!list) {
      throw new NotFoundError('List not found');
    }

    return list;
  }

  private async findMemberInvitation(
    listId: number,
    inviteeId: number,
    status?: InviteStatus
  ): Promise<ListInvitation | null> {
    return this.getInvitationRepository().findOne({
      where: {
        listId: BigInt(listId),
        inviteeId: BigInt(inviteeId),
        ...(status ? { status } : {}),
      },
      relations: ['invitee'],
      order: { createdAt: 'DESC' },
    });
  }

  async getListRole(
    listId: number,
    userId?: number
  ): Promise<'OWNER' | 'EDITOR' | 'VIEWER' | null> {
    const list = await this.listRepository.findListById(listId);

    if (!list || !userId) {
      return null;
    }

    if (this.isOwner(list, userId)) {
      return 'OWNER';
    }

    const invitation = await this.findMemberInvitation(listId, userId, InviteStatus.ACCEPTED);
    if (!invitation || invitation.status !== InviteStatus.ACCEPTED) {
      return null;
    }

    return invitation.permission === ListPermission.EDITOR ? 'EDITOR' : 'VIEWER';
  }

  async assertListOwner(listId: number, userId: number): Promise<CustomList> {
    const list = await this.findListOrThrow(listId);

    if (!this.isOwner(list, userId)) {
      throw new AnilistAPIError('Only list owner can manage this resource', 403, {
        listId,
        userId,
      });
    }

    return list;
  }

  async assertCanEditList(listId: number, userId: number): Promise<CustomList> {
    const list = await this.findListOrThrow(listId);
    if (this.isOwner(list, userId)) {
      return list;
    }

    const invitation = await this.findMemberInvitation(listId, userId, InviteStatus.ACCEPTED);
    if (
      !invitation ||
      invitation.status !== InviteStatus.ACCEPTED ||
      invitation.permission !== ListPermission.EDITOR
    ) {
      throw new AnilistAPIError('You do not have permission to edit this list', 403, {
        listId,
        userId,
      });
    }

    return list;
  }

  async assertCanViewList(listId: number, userId?: number): Promise<CustomList> {
    const list = await this.findListOrThrow(listId);

    if (list.privacy === PrivacyMode.PUBLIC || this.isOwner(list, userId)) {
      return list;
    }

    if (!userId) {
      throw new AnilistAPIError('You do not have permission to view this list', 403, {
        listId,
        privacy: list.privacy,
      });
    }

    const invitation = await this.findMemberInvitation(listId, userId, InviteStatus.ACCEPTED);
    if (!invitation || invitation.status !== InviteStatus.ACCEPTED) {
      throw new AnilistAPIError('You do not have permission to view this list', 403, {
        listId,
        privacy: list.privacy,
      });
    }

    return list;
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
      const list = await this.assertCanViewList(listId, userId);

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
      const list = await this.assertCanViewList(listId);

      return list.items || [];
    }, 'getListAnimes');
  }

  // ==================== PHASE 2: MEMBER MANAGEMENT ====================

  async listMembers(listId: number): Promise<ListMemberDto[]> {
    this._validateId(listId, 'List ID');

    return this._executeWithErrorHandling(async () => {
      const list = await this.findListOrThrow(listId);
      const invitationRepo = this.getInvitationRepository();

      const acceptedInvitations = await invitationRepo.find({
        where: {
          listId: BigInt(listId),
          status: InviteStatus.ACCEPTED,
        },
        relations: ['invitee'],
        order: { createdAt: 'ASC' },
      });

      const members: ListMemberDto[] = [];

      if (list.owner) {
        members.push(this.mapMemberDto(list.owner, ListPermission.EDITOR, true, list.createdAt));
      }

      for (const invitation of acceptedInvitations) {
        if (!invitation.invitee) {
          continue;
        }

        members.push(
          this.mapMemberDto(invitation.invitee, invitation.permission, false, invitation.createdAt)
        );
      }

      return members;
    }, 'listMembers');
  }

  async addMember(listId: number, userId: number, data: AddMemberDto): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._validateString(data.username, 'Username', { minLength: 1, maxLength: 255 });

    await this._executeWithErrorHandling(async () => {
      const list = await this.assertListOwner(listId, userId);
      const targetUser = await this.userRepository.findByUsername(data.username.trim());

      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      if (this.isOwner(list, this.toNumberId(targetUser.id))) {
        throw new ValidationError('Owner is already a member of the list');
      }

      const permission = this.resolveMemberPermission(data);
      const invitationRepo = this.getInvitationRepository();
      const targetUserId = this.toNumberId(targetUser.id);
      const acceptedInvitation = await this.findMemberInvitation(
        listId,
        targetUserId,
        InviteStatus.ACCEPTED
      );
      const pendingInvitation = await this.findMemberInvitation(
        listId,
        targetUserId,
        InviteStatus.PENDING
      );

      if (acceptedInvitation) {
        acceptedInvitation.inviterId = BigInt(userId);
        acceptedInvitation.permission = permission;
        acceptedInvitation.status = InviteStatus.ACCEPTED;
        await invitationRepo.save(acceptedInvitation);
      } else if (pendingInvitation) {
        pendingInvitation.inviterId = BigInt(userId);
        pendingInvitation.permission = permission;
        pendingInvitation.status = InviteStatus.ACCEPTED;
        await invitationRepo.save(pendingInvitation);
      } else {
        await invitationRepo.save(
          invitationRepo.create({
            listId: BigInt(listId),
            inviterId: BigInt(userId),
            inviteeId: BigInt(targetUserId),
            permission,
            status: InviteStatus.ACCEPTED,
          })
        );
      }

      await invitationRepo.delete({
        listId: BigInt(listId),
        inviteeId: BigInt(targetUserId),
        status: InviteStatus.PENDING,
      });

      this._logInfo('List member added', {
        listId,
        userId,
        username: data.username,
        permission,
      });
    }, 'addMember');
  }

  async updateMemberPermission(
    listId: number,
    userId: number,
    data: UpdateMemberPermissionDto
  ): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._validateString(data.username, 'Username', { minLength: 1, maxLength: 255 });

    await this._executeWithErrorHandling(async () => {
      await this.assertListOwner(listId, userId);

      const targetUser = await this.userRepository.findByUsername(data.username.trim());
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      if (String(targetUser.id) === String(userId)) {
        throw new ValidationError('Owner permission cannot be changed');
      }

      const permission = this.resolveMemberPermission(data);
      const invitationRepo = this.getInvitationRepository();
      const member = await this.findMemberInvitation(
        listId,
        this.toNumberId(targetUser.id),
        InviteStatus.ACCEPTED
      );

      if (!member || member.status !== InviteStatus.ACCEPTED) {
        throw new NotFoundError('Member not found');
      }

      member.permission = permission;
      member.status = InviteStatus.ACCEPTED;
      await invitationRepo.save(member);

      this._logInfo('Member permission updated', {
        listId,
        userId,
        username: data.username,
        permission,
      });
    }, 'updateMemberPermission');
  }

  async removeMember(listId: number, userId: number, username: string): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._validateString(username, 'Username', { minLength: 1, maxLength: 255 });

    await this._executeWithErrorHandling(async () => {
      await this.assertListOwner(listId, userId);

      const targetUser = await this.userRepository.findByUsername(username.trim());
      if (!targetUser) {
        throw new NotFoundError('User not found');
      }

      if (String(targetUser.id) === String(userId)) {
        throw new ValidationError('Owner cannot remove themselves from the list');
      }

      const invitationRepo = this.getInvitationRepository();
      const member = await this.findMemberInvitation(
        listId,
        this.toNumberId(targetUser.id),
        InviteStatus.ACCEPTED
      );

      if (!member) {
        throw new NotFoundError('Member not found');
      }

      await invitationRepo.delete({
        listId: BigInt(listId),
        inviteeId: BigInt(this.toNumberId(targetUser.id)),
      });

      this._logInfo('List member removed', {
        listId,
        userId,
        username,
      });
    }, 'removeMember');
  }

  // ==================== PHASE 3: INVITES & REQUESTS ====================

  async requestJoin(listId: number, userId: number, data: RequestJoinDto): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');

    await this._executeWithErrorHandling(async () => {
      const list = await this.findListOrThrow(listId);

      if (list.privacy !== PrivacyMode.PUBLIC) {
        throw new ValidationError(
          'Only public lists accept join requests. For private lists, owner invitation is required.'
        );
      }

      const currentRole = await this.getListRole(listId, userId);
      if (currentRole) {
        throw new ValidationError('User already has access to this list');
      }

      const invitationRepo = this.getInvitationRepository();
      const existingPending = await this.findMemberInvitation(listId, userId, InviteStatus.PENDING);

      if (existingPending) {
        throw new ValidationError('Join request is already pending');
      }

      const declinedInvitation = await this.findMemberInvitation(
        listId,
        userId,
        InviteStatus.DECLINED
      );

      if (declinedInvitation) {
        declinedInvitation.inviterId = BigInt(userId);
        declinedInvitation.inviteeId = BigInt(userId);
        declinedInvitation.permission = ListPermission.VIEWER;
        declinedInvitation.status = InviteStatus.PENDING;
        await invitationRepo.save(declinedInvitation);
      } else {
        await invitationRepo.save(
          invitationRepo.create({
            listId: BigInt(listId),
            inviterId: BigInt(userId),
            inviteeId: BigInt(userId),
            permission: ListPermission.VIEWER,
            status: InviteStatus.PENDING,
          })
        );
      }

      this._logInfo('Join request submitted', {
        listId,
        userId,
        hasMessage: !!data.message,
      });
    }, 'requestJoin');
  }

  async requestEdit(listId: number, userId: number, data: RequestEditDto): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');

    await this._executeWithErrorHandling(async () => {
      await this.assertCanViewList(listId, userId);

      const role = await this.getListRole(listId, userId);
      if (role !== 'VIEWER') {
        throw new ValidationError('Only viewers can request edit permission');
      }

      const invitationRepo = this.getInvitationRepository();
      const existingPending = await this.findMemberInvitation(listId, userId, InviteStatus.PENDING);
      if (existingPending) {
        throw new ValidationError('Edit request is already pending');
      }

      const existingAccepted = await this.findMemberInvitation(
        listId,
        userId,
        InviteStatus.ACCEPTED
      );

      if (!existingAccepted || existingAccepted.permission !== ListPermission.VIEWER) {
        throw new ValidationError('Only viewers can request edit permission');
      }

      const declinedInvitation = await this.findMemberInvitation(
        listId,
        userId,
        InviteStatus.DECLINED
      );

      if (declinedInvitation) {
        declinedInvitation.inviterId = BigInt(userId);
        declinedInvitation.inviteeId = BigInt(userId);
        declinedInvitation.permission = ListPermission.EDITOR;
        declinedInvitation.status = InviteStatus.PENDING;
        await invitationRepo.save(declinedInvitation);
      } else {
        await invitationRepo.save(
          invitationRepo.create({
            listId: BigInt(listId),
            inviterId: BigInt(userId),
            inviteeId: BigInt(userId),
            permission: ListPermission.EDITOR,
            status: InviteStatus.PENDING,
          })
        );
      }

      this._logInfo('Edit request submitted', {
        listId,
        userId,
        hasMessage: !!data.message,
      });
    }, 'requestEdit');
  }

  async getListRequests(listId: number, userId: number): Promise<ListRequestDto[]> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');

    return this._executeWithErrorHandling(async () => {
      await this.assertListOwner(listId, userId);

      const invitationRepo = this.getInvitationRepository();
      const pendingRequests = await invitationRepo.find({
        where: {
          listId: BigInt(listId),
          status: InviteStatus.PENDING,
        },
        relations: ['invitee'],
        order: { createdAt: 'DESC' },
      });

      return pendingRequests
        .map((invitation) => this.mapRequestDto(invitation))
        .filter((request): request is ListRequestDto => request !== null);
    }, 'getListRequests');
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

    await this._executeWithErrorHandling(async () => {
      await this.assertListOwner(listId, userId);

      const invitationRepo = this.getInvitationRepository();
      const request = await invitationRepo.findOne({
        where: {
          id: BigInt(requestId),
          listId: BigInt(listId),
          status: InviteStatus.PENDING,
        },
        relations: ['invitee'],
      });

      if (!request) {
        throw new NotFoundError('Request not found');
      }

      const requestUserId = this.toNumberId(request.inviteeId);
      const nextStatus = this.normalizeRequestAction(data.action);
      const existingAccepted = await this.findMemberInvitation(
        listId,
        requestUserId,
        InviteStatus.ACCEPTED
      );

      if (nextStatus === InviteStatus.ACCEPTED) {
        if (request.permission === ListPermission.EDITOR) {
          if (existingAccepted) {
            existingAccepted.permission = ListPermission.EDITOR;
            existingAccepted.status = InviteStatus.ACCEPTED;
            await invitationRepo.save(existingAccepted);
            await invitationRepo.delete({ id: request.id });
          } else {
            request.status = InviteStatus.ACCEPTED;
            await invitationRepo.save(request);
          }
        } else {
          if (existingAccepted) {
            await invitationRepo.delete({ id: request.id });
          } else {
            request.status = InviteStatus.ACCEPTED;
            await invitationRepo.save(request);
          }
        }
      } else {
        request.status = InviteStatus.DECLINED;
        await invitationRepo.save(request);
      }

      this._logInfo('List request processed', {
        listId,
        userId,
        requestId,
        action: data.action,
      });
    }, 'respondToRequest');
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

  // ==================== PHASE 5: SEARCH & DISCOVER & ITEM MANAGE ====================

  async searchLists(options: SearchListDto, userId?: number): Promise<ListSearchResult> {
    this._validateString(options.query, 'Query', { minLength: 1, maxLength: 255 });

    return this._executeWithErrorHandling(async () => {
      const qb = this.listRepository
        .getRepository()
        .createQueryBuilder('list')
        .leftJoinAndSelect('list.owner', 'owner')
        .leftJoinAndSelect('list.items', 'items')
        .where('list.name LIKE :query', { query: `%${options.query}%` })
        .orWhere('list.description LIKE :query', { query: `%${options.query}%` });

      if (options.isPublicOnly) {
        qb.andWhere('list.privacy = :privacy', { privacy: PrivacyMode.PUBLIC });
      } else if (userId) {
        // Find public lists OR lists owned by user
        qb.andWhere('(list.privacy = :privacy OR list.ownerId = :userId)', {
          privacy: PrivacyMode.PUBLIC,
          userId,
        });
      } else {
        qb.andWhere('list.privacy = :privacy', { privacy: PrivacyMode.PUBLIC });
      }

      const sortOrder = options.sortBy === 'NAME' ? 'ASC' : 'DESC';
      const sortColumn = options.sortBy === 'NAME' ? 'list.name' : 'list.updatedAt'; // Fallback MOST_LIKED to updatedAt for now

      qb.orderBy(sortColumn, sortOrder);

      const page = Math.max(1, options.page || 1);
      const limit = Math.min(50, Math.max(1, options.limit || 10));
      qb.skip((page - 1) * limit).take(limit);

      const [lists, total] = await qb.getManyAndCount();

      return {
        items: lists.map((list) => this.mapListSummary(list)),
        total,
      };
    }, 'searchLists');
  }

  async discoverLists(): Promise<ListSummaryDto[]> {
    return this._executeWithErrorHandling(async () => {
      const qb = this.listRepository
        .getRepository()
        .createQueryBuilder('list')
        .leftJoinAndSelect('list.owner', 'owner')
        .leftJoinAndSelect('list.items', 'items')
        .where('list.privacy = :privacy', { privacy: PrivacyMode.PUBLIC })
        .orderBy('list.updatedAt', 'DESC')
        .take(20);

      const lists = await qb.getMany();
      return lists.map((list) => this.mapListSummary(list));
    }, 'discoverLists');
  }

  async addAnimeToList(listId: number, userId: number, data: AddAnimeToListDto): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._validateId(data.anilistId, 'AniList ID');

    await this._executeWithErrorHandling(async () => {
      await this.assertCanEditList(listId, userId);

      // Resolve anilistId to mediaId by querying anime repository
      const animeItem = await this.animeRepository.findByExternalId(data.anilistId);
      if (!animeItem) {
        throw new NotFoundError(
          `Anime with AniList ID ${data.anilistId} not found. Please search and sync the anime first.`
        );
      }

      const mediaId = animeItem.id;
      const listItemRepo = this.getListItemRepository();

      const existing = await listItemRepo.findOne({
        where: { listId: BigInt(listId), mediaId: BigInt(mediaId) },
      });

      if (existing) {
        throw new ValidationError('Anime is already in this list');
      }

      // Find max orderIndex
      const maxOrder = await listItemRepo
        .createQueryBuilder('item')
        .where('item.list_id = :listId', { listId })
        .select('MAX(item.order_index)', 'max')
        .getRawOne();

      const nextOrder = (maxOrder?.max || 0) + 1;

      await listItemRepo.save(
        listItemRepo.create({
          listId: BigInt(listId),
          mediaId: BigInt(mediaId),
          addedById: BigInt(userId),
          orderIndex: nextOrder,
          note: data.note?.trim() || null,
        })
      );

      this._logInfo('Anime added to list', { listId, userId, anilistId: data.anilistId, mediaId });
    }, 'addAnimeToList');
  }

  async removeAnimeFromList(listId: number, userId: number, anilistId: number): Promise<void> {
    this._validateId(listId, 'List ID');
    this._validateId(userId, 'User ID');
    this._validateId(anilistId, 'AniList ID');

    await this._executeWithErrorHandling(async () => {
      await this.assertCanEditList(listId, userId);

      // Resolve anilistId to mediaId by querying anime repository
      const animeItem = await this.animeRepository.findByExternalId(anilistId);
      if (!animeItem) {
        throw new NotFoundError(
          `Anime with AniList ID ${anilistId} not found. Please search and sync the anime first.`
        );
      }

      const mediaId = animeItem.id;
      const listItemRepo = this.getListItemRepository();

      const existing = await listItemRepo.findOne({
        where: { listId: BigInt(listId), mediaId: BigInt(mediaId) },
      });

      if (!existing) {
        throw new NotFoundError('Anime not found in this list');
      }

      await listItemRepo.delete({ id: existing.id });

      this._logInfo('Anime removed from list', { listId, userId, anilistId, mediaId });
    }, 'removeAnimeFromList');
  }
}
