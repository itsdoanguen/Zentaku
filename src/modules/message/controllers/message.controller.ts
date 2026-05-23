import type { Request, Response } from 'express';
import { BaseController, type AuthenticatedRequest } from '../../../core/base/BaseController';
import { ValidationError } from '../../../shared/utils/error';
import type { IMessageService } from '../types/message.types';

export class MessageController extends BaseController<IMessageService> {
  constructor(messageService: IMessageService) {
    super(messageService);
  }

  private getAuthUserId(authReq: AuthenticatedRequest): bigint {
    const userIdStr = this.getUserId(authReq);
    if (!userIdStr) {
      throw new ValidationError('Authentication required');
    }
    return BigInt(userIdStr);
  }

  sendMessage = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = this.getAuthUserId(authReq);
    const channelId = BigInt(req.params.channelId as string);

    const message = await this.service.sendMessage(channelId, userId, req.body);

    this.created(res, message);
  });

  getMessageHistory = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = this.getAuthUserId(authReq);
    const channelId = BigInt(req.params.channelId as string);

    const query = {
      cursor: req.query.cursor as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      direction: req.query.direction as 'backward' | 'forward' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    };

    const history = await this.service.getMessageHistory(channelId, userId, query);

    this.success(res, history);
  });

  updateReadCursor = this.asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    this.requireAuth(authReq);
    const userId = this.getAuthUserId(authReq);
    const channelId = BigInt(req.params.channelId as string);
    const lastReadMessageId = BigInt(req.body.lastReadMessageId as string);

    const result = await this.service.updateReadCursor(channelId, userId, lastReadMessageId);

    this.success(res, result);
  });
}

export default MessageController;
