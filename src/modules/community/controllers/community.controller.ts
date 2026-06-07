import type { Request, Response } from 'express';
import { BaseController, type AuthenticatedRequest } from '../../../core/base/BaseController';
import type { ICommunityService } from '../types/community.types';

export class CommunityController extends BaseController<ICommunityService> {
  constructor(communityService: ICommunityService) {
    super(communityService);
  }

  createCommunity = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = BigInt(this.getUserId(authReq)!);
    const community = await this.service.createCommunity(userId, req.body);

    this.created(res, {
      id: String(community.id),
      name: community.name,
      description: community.description ?? null,
      isPublic: community.isPublic,
      inviteCode: community.inviteCode ?? null,
      ownerId: String(community.ownerId),
      createdAt: community.createdAt.toISOString(),
    });
  });

  updateCommunity = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = BigInt(this.getUserId(authReq)!);
    const communityId = BigInt(req.params.communityId as string);
    const community = await this.service.updateCommunity(communityId, userId, req.body);

    this.success(res, {
      id: String(community.id),
      name: community.name,
      description: community.description ?? null,
      icon: community.icon ?? null,
      isPublic: community.isPublic,
      inviteCode: community.inviteCode ?? null,
      ownerId: String(community.ownerId),
      createdAt: community.createdAt.toISOString(),
    });
  });

  deleteCommunity = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = BigInt(this.getUserId(authReq)!);
    const communityId = BigInt(req.params.communityId as string);
    await this.service.deleteCommunity(communityId, userId);

    this.noContent(res);
  });

  getCommunityDetail = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = BigInt(this.getUserId(authReq)!);
    const communityId = BigInt(req.params.communityId as string);
    const community = await this.service.getCommunityDetail(communityId, userId);

    this.success(res, {
      id: String(community.id),
      name: community.name,
      description: community.description ?? null,
      icon: community.icon ?? null,
      isPublic: community.isPublic,
      inviteCode: community.inviteCode ?? null,
      ownerId: String(community.ownerId),
      createdAt: community.createdAt.toISOString(),
    });
  });

  listCommunities = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage as string, 10) : 20;
    const q = req.query.q ? String(req.query.q) : undefined;
    const isPublic = req.query.isPublic !== undefined ? req.query.isPublic === 'true' : undefined;
    const sortBy = req.query.sortBy as 'createdAt' | 'membersCount' | 'name' | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

    const result = await this.service.listCommunities({
      page,
      perPage,
      q,
      isPublic,
      sortBy,
      sortOrder,
    });

    this.paginated(res, result.items, {
      currentPage: result.page,
      perPage: result.perPage,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      nextPage: result.hasNextPage ? result.page + 1 : null,
      previousPage: result.hasPreviousPage ? result.page - 1 : null,
    });
  });

  joinCommunity = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = BigInt(this.getUserId(authReq)!);
    const { inviteCode } = req.body;
    const member = await this.service.joinCommunity(userId, inviteCode);

    this.success(res, {
      communityId: String(member.communityId),
      userId: String(member.userId),
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
    });
  });

  leaveCommunity = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = BigInt(this.getUserId(authReq)!);
    const communityId = BigInt(req.params.communityId as string);
    await this.service.leaveCommunity(userId, communityId);

    this.success(res, { message: 'Successfully left the community' });
  });

  toggleMute = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = BigInt(this.getUserId(authReq)!);
    const communityId = BigInt(req.params.communityId as string);
    const isMuted = req.body.isMuted === true;

    const member = await this.service.toggleMute(userId, communityId, isMuted);
    this.success(res, {
      communityId: String(member.communityId),
      userId: String(member.userId),
      isMuted: member.isMuted,
    });
  });
}

export default CommunityController;
