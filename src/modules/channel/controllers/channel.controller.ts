import type { Request, Response } from 'express';
import { BaseController, type AuthenticatedRequest } from '../../../core/base/BaseController';
import { ValidationError } from '../../../shared/utils/error';
import type { IChannelService } from '../types/channel.types';

export class ChannelController extends BaseController<IChannelService> {
  constructor(channelService: IChannelService) {
    super(channelService);
  }

  private getAuthUserId(authReq: AuthenticatedRequest): bigint {
    const userIdStr = this.getUserId(authReq);
    if (!userIdStr) {
      throw new ValidationError('Authentication required');
    }
    return BigInt(userIdStr);
  }

  createChannel = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = this.getAuthUserId(authReq);
    const communityId = BigInt(req.params.communityId as string);

    const channel = await this.service.createChannel(communityId, userId, req.body);

    this.created(res, {
      id: String(channel.id),
      communityId: String(channel.communityId),
      name: channel.name,
      type: channel.type,
      isPrivate: channel.isPrivate,
      position: channel.position,
      createdAt: channel.createdAt.toISOString(),
    });
  });

  listChannels = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = this.getAuthUserId(authReq);
    const communityId = BigInt(req.params.communityId as string);

    const channels = await this.service.listChannels(communityId, userId);

    this.success(
      res,
      channels.map((channel) => ({
        id: String(channel.id),
        communityId: String(channel.communityId),
        name: channel.name,
        type: channel.type,
        isPrivate: channel.isPrivate,
        position: channel.position,
        createdAt: channel.createdAt.toISOString(),
      }))
    );
  });

  createOrGetPrivateChannel = this.asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const authReq = req as AuthenticatedRequest;
      this.requireAuth(authReq);
      const userId = this.getAuthUserId(authReq);
      const recipientId = BigInt(req.body.recipientId as string);

      const channel = await this.service.createOrGetPrivateChannel(userId, recipientId);

      this.success(res, {
        id: String(channel.id),
        communityId: null,
        name: null,
        type: channel.type,
        isPrivate: channel.isPrivate,
        position: channel.position,
        createdAt: channel.createdAt.toISOString(),
        participants: channel.participants.map((p) => ({
          userId: String(p.userId),
          joinedAt: p.createdAt ? p.createdAt.toISOString() : undefined,
        })),
      });
    }
  );

  getChannelDetail = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = this.getAuthUserId(authReq);
    const channelId = BigInt(req.params.channelId as string);

    const channel = await this.service.getChannelDetail(channelId, userId);

    this.success(res, {
      id: String(channel.id),
      communityId: channel.communityId ? String(channel.communityId) : null,
      name: channel.name,
      type: channel.type,
      isPrivate: channel.isPrivate,
      position: channel.position,
      createdAt: channel.createdAt.toISOString(),
    });
  });
}

export default ChannelController;
