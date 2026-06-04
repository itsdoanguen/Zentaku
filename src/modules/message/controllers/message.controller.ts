import type { Request, Response } from 'express';
import { BaseController, type AuthenticatedRequest } from '../../../core/base/BaseController';
import { ValidationError } from '../../../shared/utils/error';
import type { IMessageService } from '../types/message.types';

import type { IRealtimeGateway } from '../../../realtime/gateway/gateway.interface';
import type { NotificationService } from '../../notification/services/notification.service';
import { NotificationType } from '../../../entities/types/enums';
import type { IChannelRepository } from '../../channel/types/channel.types';
import logger from '../../../shared/utils/logger';

export class MessageController extends BaseController<IMessageService> {
  private readonly realtimeGateway?: IRealtimeGateway;
  private readonly notificationService?: NotificationService;
  private readonly channelRepository?: IChannelRepository;

  constructor(
    messageService: IMessageService,
    realtimeGateway?: IRealtimeGateway,
    notificationService?: NotificationService,
    channelRepository?: IChannelRepository
  ) {
    super(messageService);
    this.realtimeGateway = realtimeGateway;
    this.notificationService = notificationService;
    this.channelRepository = channelRepository;
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

    if (this.realtimeGateway) {
      this.realtimeGateway.broadcastToRoom(`channel:${channelId}`, {
        event: 'message.created',
        version: '1.0',
        requestId: req.requestId || Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        data: message,
      });

      // Async notify offline participants
      this.notifyOfflineParticipants(channelId, message).catch((err) => {
        logger.error(`[MessageController] Failed to notify offline participants: ${err.message}`);
      });
    }

    this.created(res, message);
  });

  private async notifyOfflineParticipants(channelId: bigint, message: any): Promise<void> {
    if (!this.notificationService || !this.channelRepository || !this.realtimeGateway) return;

    // 1. Lấy danh sách participants của channel
    const channel = await this.channelRepository.findChannelById(channelId);
    if (!channel || !channel.participants) return;

    // 2. Lấy danh sách user đang active trong socket room của channel
    const roomName = `channel:${channelId}`;
    const getRoomParticipants = (this.realtimeGateway as any).getRoomParticipants;
    const activeUserIds = new Set<string>();

    if (getRoomParticipants) {
      const activeParticipants = getRoomParticipants(roomName);
      for (const p of activeParticipants) {
        activeUserIds.add(String(p.userId));
      }
    }

    // 3. Chuẩn bị nội dung thông báo
    const content = message.content || 'Sent an attachment';
    const messagePreview = content.length > 80 ? content.substring(0, 80) + '...' : content;
    const senderId = message.sender?.id || message.senderId;
    const senderName = message.sender?.displayName || message.sender?.username || 'Someone';

    // 4. Gửi thông báo cho những người không active
    for (const participant of channel.participants) {
      const participantUserId = String(participant.userId);

      // Bỏ qua người gửi
      if (participantUserId === String(senderId)) continue;

      // Bỏ qua những người đang mở cửa sổ chat này
      if (activeUserIds.has(participantUserId)) continue;

      await this.notificationService.createAndPush(
        participant.userId,
        NotificationType.MESSAGE,
        `New message from ${senderName}`,
        messagePreview,
        {
          channelId: String(channelId),
          senderId: String(senderId),
          senderName,
          senderAvatar: message.sender?.avatar || null,
          messagePreview,
        }
      );
    }
  }

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
