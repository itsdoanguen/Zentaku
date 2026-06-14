/**
 * List Controller
 *
 * HTTP request handler layer for list operations
 */

import type { Request, Response } from 'express';
import {
  BaseController,
  type AuthenticatedRequest,
  type IBaseService,
} from '../../../core/base/BaseController';
import type {
  AddMemberDto,
  CreateListDto,
  AddAnimeToListDto,
  RequestEditDto,
  RequestJoinDto,
  RespondToRequestDto,
  SearchListDto,
  UpdateListDto,
  UpdateMemberPermissionDto,
  UpdateThemeDto,
} from '../dto/list.dto';
import type { IListService } from '../types/list.types';

import type { RecommendationService } from '../services/recommendation.service';

class ListController extends BaseController<IListService & IBaseService> {
  private readonly recommendationService: RecommendationService;

  constructor(
    listService: IListService & IBaseService,
    recommendationService: RecommendationService
  ) {
    super(listService);
    this.recommendationService = recommendationService;
  }

  // ==================== PHASE 1: CRUD ====================

  /**
   * POST /list/create
   * Create a new custom list
   */
  createList = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const createData = this.getBody<CreateListDto>(req);
    const newList = await this.service.createList(userId, createData);
    this.success(res, newList, 201);
  });

  /**
   * POST /list/upload-banner
   * Upload list banner image
   */
  uploadBanner = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const file = req.file;
    if (!file) {
      this.error(res, 'No file uploaded', 400);
      return;
    }

    const relativePath = `/uploads/lists/banner/${file.filename}`;
    this.success(res, { url: relativePath }, 200);
  });

  /**
   * GET /list/user
   * Get all lists by username
   */
  getUserLists = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = this.getUserId(authReq);

    const username = this.getStringQuery(req, 'username');

    const lists = await this.service.getUserLists(username, userId ?? undefined);
    this.success(res, lists);
  });

  /**
   * GET /list/user/joined
   * Get all lists that the logged-in user has joined
   */
  getUserJoinedLists = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const lists = await this.service.getUserJoinedLists(userId);
    this.success(res, lists);
  });

  /**
   * GET /list/:listId
   * Get list detail with anime items
   */
  getListDetail = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = this.getUserId(authReq);

    const listId = this.getIntParam(req, 'listId');

    const listDetail = await this.service.getListDetail(listId, userId ?? undefined);
    this.success(res, listDetail);
  });

  /**
   * GET /list/anime/:listId
   * Get all anime items in a list
   */
  getListAnimes = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const listId = this.getIntParam(req, 'listId');

    const animes = await this.service.getListAnimes(listId);
    this.success(res, animes);
  });

  /**
   * GET /list/:listId/recommendations
   * Get recommended anime for a list
   */
  getListRecommendations = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const listId = this.getIntParam(req, 'listId');
    const limit = this.getIntQuery(req, 'limit', 10) || 10;

    const recommendations = await this.recommendationService.getRecommendationsForList(
      listId,
      limit
    );
    this.success(res, recommendations);
  });

  /**
   * PUT /list/:listId/update
   * Update list details
   */
  updateList = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const updateData = this.getBody<UpdateListDto>(req);

    const updatedList = await this.service.updateList(listId, userId, updateData);
    this.success(res, updatedList);
  });

  /**
   * DELETE /list/:listId/delete
   * Delete a list
   */
  deleteList = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');

    await this.service.deleteList(listId, userId);
    this.success(res, { message: 'List deleted successfully' });
  });

  /**
   * POST /list/:listId/chat
   * Create or get list chat community
   */
  createListChat = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const result = await this.service.createListChat(listId, userId);
    this.success(res, result);
  });

  // ==================== PHASE 2: MEMBER MANAGEMENT (STUBS) ====================

  listMembers = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const listId = this.getIntParam(req, 'listId');
    const members = await this.service.listMembers(listId);
    this.success(res, members);
  });

  addMember = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const payload = this.getBody<AddMemberDto>(req);
    await this.service.addMember(listId, userId, payload);
    this.success(res, { message: 'Member added' });
  });

  updateMemberPermission = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const payload = this.getBody<UpdateMemberPermissionDto>(req);
    await this.service.updateMemberPermission(listId, userId, payload);
    this.success(res, { message: 'Member permission updated' });
  });

  removeMember = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const username = this.getStringQuery(req, 'username');
    await this.service.removeMember(listId, userId, username);
    this.success(res, { message: 'Member removed' });
  });

  // ==================== PHASE 3: INVITES & REQUESTS (STUBS) ====================

  requestJoin = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const payload = this.getBody<RequestJoinDto>(req);
    await this.service.requestJoin(listId, userId, payload);
    this.success(res, { message: 'Join request submitted' });
  });

  requestEdit = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const payload = this.getBody<RequestEditDto>(req);
    await this.service.requestEdit(listId, userId, payload);
    this.success(res, { message: 'Edit request submitted' });
  });

  getListRequests = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const requests = await this.service.getListRequests(listId, userId);
    this.success(res, requests);
  });

  respondToRequest = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const requestId = this.getIntParam(req, 'requestId');
    const payload = this.getBody<RespondToRequestDto>(req);
    await this.service.respondToRequest(listId, userId, requestId, payload);
    this.success(res, { message: 'Request processed' });
  });

  // ==================== PHASE 4: THEME & LIKES (STUBS) ====================

  updateTheme = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const payload = this.getBody<UpdateThemeDto>(req);
    const updated = await this.service.updateTheme(listId, userId, payload);
    this.success(res, updated);
  });

  toggleLike = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    await this.service.toggleLike(listId, userId);
    this.success(res, { message: 'Like status toggled' });
  });

  getLikeStatus = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const likeStatus = await this.service.getLikeStatus(listId, userId);
    this.success(res, likeStatus);
  });

  getListLikers = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const listId = this.getIntParam(req, 'listId');
    const limit = this.getIntQuery(req, 'limit', 20) || 20;
    const result = await this.service.getListLikers(listId, limit);
    this.success(res, result);
  });

  getMostLikedLists = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = this.getIntQuery(req, 'page', 1) || 1;
    const limit = this.getIntQuery(req, 'limit', 10) || 10;
    const result = await this.service.getMostLikedLists({ page, limit });
    this.success(res, result);
  });

  getUserLikedLists = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const page = this.getIntQuery(req, 'page', 1) || 1;
    const limit = this.getIntQuery(req, 'limit', 10) || 10;
    const result = await this.service.getUserLikedLists(userId, { page, limit });
    this.success(res, result);
  });

  // ==================== PHASE 5: SEARCH & DISCOVER & ITEM MANAGE ====================

  searchLists = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = this.getUserId(authReq);
    const payload = this.getBody<SearchListDto>(req);
    const result = await this.service.searchLists(payload, userId ?? undefined);
    this.success(res, result);
  });

  discoverLists = this.asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await this.service.discoverLists();
    this.success(res, result);
  });

  addAnimeToList = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const payload = this.getBody<AddAnimeToListDto>(req);
    await this.service.addAnimeToList(listId, userId, payload);
    this.success(res, { message: 'Anime added to list successfully' });
  });

  removeAnimeFromList = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);

    const userId = this.getUserId(authReq);
    if (!userId) {
      this.error(res, 'Unauthorized', 401);
      return;
    }

    const listId = this.getIntParam(req, 'listId');
    const anilistId = this.getIntParam(req, 'anilistId');
    await this.service.removeAnimeFromList(listId, userId, anilistId);
    this.success(res, { message: 'Anime removed from list successfully' });
  });
}

export = ListController;
