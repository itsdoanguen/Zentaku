import crypto from 'crypto';
import type { CreateWatchRoomDto, UpdatePlaybackStateDto } from '../dto/watch-party.dto';
import type { NotificationService } from '../../notification/services/notification.service';
import { NotificationType } from '../../../entities/types/enums';
import logger from '../../../shared/utils/logger';

export interface InMemoryWatchRoom {
  channelId: string;
  hostId: string;
  mediaId: string | null;
  isPlaying: boolean;
  currentTimestamp: number;
  currentSourceUrl: string | null;
  playlistQueue: any[];
  messages: any[];
  settings: Record<string, unknown>;
  lastSyncedAt: Date;
}

export class WatchPartyService {
  private rooms: Map<string, InMemoryWatchRoom>;

  constructor(
    private realtimeGateway?: any,
    private notificationService?: NotificationService,
    private channelService?: any,
    private messageService?: any,
    private userRepository?: any
  ) {
    this.rooms = new Map();
  }

  async createWatchRoom(userId: bigint, data: CreateWatchRoomDto) {
    const channelId = data.channelId || crypto.randomUUID();

    const config: InMemoryWatchRoom = {
      channelId,
      hostId: userId.toString(),
      mediaId: data.mediaId ? data.mediaId.toString() : null,
      isPlaying: false,
      currentTimestamp: 0,
      currentSourceUrl: data.currentSourceUrl || null,
      playlistQueue: [],
      messages: [],
      settings: data.settings || {},
      lastSyncedAt: new Date(),
    };

    this.rooms.set(channelId, config);

    return this.mapConfigToDto(config);
  }

  async getWatchRoom(channelId: string) {
    const config = this.rooms.get(channelId);
    if (!config) {
      const err = new Error('Watch room not found') as any;
      err.code = 'ROOM_NOT_FOUND';
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }
    return this.mapConfigToDto(config);
  }

  async updatePlaybackState(channelId: string, userId: bigint, data: UpdatePlaybackStateDto) {
    const config = this.rooms.get(channelId);
    if (!config) {
      const err = new Error('Watch room not found') as any;
      err.code = 'ROOM_NOT_FOUND';
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (config.hostId !== userId.toString()) {
      const err = new Error('Only host can control playback') as any;
      err.code = 'HOST_REQUIRED';
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }

    config.lastSyncedAt = new Date();

    if (data.action === 'play') {
      config.isPlaying = true;
      if (data.timestamp !== undefined) config.currentTimestamp = data.timestamp;
    } else if (data.action === 'pause') {
      config.isPlaying = false;
      if (data.timestamp !== undefined) config.currentTimestamp = data.timestamp;
    } else if (data.action === 'seek') {
      if (data.timestamp !== undefined) config.currentTimestamp = data.timestamp;
    }

    this.rooms.set(channelId, config);
    return this.mapConfigToDto(config);
  }

  async updateRoomSource(
    channelId: string,
    userId: bigint,
    newSourceUrl: string,
    episodeNumber?: number,
    subUrl?: string | null,
    referer?: string | null
  ) {
    const config = this.rooms.get(channelId);
    if (!config) {
      const err = new Error('Watch room not found') as any;
      err.code = 'ROOM_NOT_FOUND';
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (config.hostId !== userId.toString()) {
      const err = new Error('Only host can change episode') as any;
      err.code = 'HOST_REQUIRED';
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }

    config.currentSourceUrl = newSourceUrl;
    config.currentTimestamp = 0;
    config.isPlaying = false; // Wait for host to play the new episode
    config.lastSyncedAt = new Date();

    if (episodeNumber !== undefined || subUrl !== undefined || referer !== undefined) {
      config.settings = {
        ...config.settings,
        ...(episodeNumber !== undefined && { episodeNumber }),
        ...(subUrl !== undefined && { subUrl }),
        ...(referer !== undefined && { referer }),
      };
    }

    this.rooms.set(channelId, config);
    return this.mapConfigToDto(config);
  }

  async joinWatchRoom(channelId: string, _userId: bigint) {
    const config = this.rooms.get(channelId);
    if (!config) {
      const err = new Error('Watch room not found') as any;
      err.code = 'ROOM_NOT_FOUND';
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }
    // Return snapshot for late joiners
    return this.mapConfigToDto(config);
  }

  async leaveWatchRoom(channelId: string, userId: bigint) {
    const config = this.rooms.get(channelId);
    if (config && config.hostId === userId.toString()) {
      this.rooms.delete(channelId);

      if (this.realtimeGateway) {
        this.realtimeGateway.broadcastToRoom(`channel:${channelId}`, {
          event: 'room.closed',
          version: '1.0',
          requestId: crypto.randomUUID(),
          timestamp: Date.now(),
          data: { channelId },
        });
      }
    }
    return { success: true };
  }

  addMessage(channelId: string, message: any) {
    const config = this.rooms.get(channelId);
    if (!config) return null;

    config.messages.push(message);
    if (config.messages.length > 100) {
      config.messages.shift();
    }
    return message;
  }

  async inviteToWatchRoom(
    channelId: string,
    hostUserId: bigint,
    targetUserId: bigint,
    frontendUrl: string = 'http://localhost:5173'
  ) {
    const config = this.rooms.get(channelId);
    if (!config) {
      const err = new Error('Watch room not found') as any;
      err.code = 'ROOM_NOT_FOUND';
      err.statusCode = 404;
      err.isOperational = true;
      throw err;
    }

    if (config.hostId !== hostUserId.toString()) {
      const err = new Error('Only host can invite users') as any;
      err.code = 'HOST_REQUIRED';
      err.statusCode = 403;
      err.isOperational = true;
      throw err;
    }

    // Get host user info for notification
    let hostDisplayName = 'Someone';
    let hostAvatar: string | null = null;
    let hostUsername = '';
    if (this.userRepository) {
      try {
        const hostUser = await this.userRepository.findById(hostUserId);
        if (hostUser) {
          hostDisplayName = hostUser.displayName || hostUser.username;
          hostAvatar = hostUser.avatar || null;
          hostUsername = hostUser.username;
        }
      } catch {
        logger.warn('[WatchPartyService] Could not fetch host user info');
      }
    }

    // 1. Send chat message with room link via private channel
    let chatChannelId: string | null = null;
    if (this.channelService && this.messageService) {
      try {
        const channel = await this.channelService.createOrGetPrivateChannel(
          hostUserId,
          targetUserId
        );
        chatChannelId = channel.id.toString();

        const inviteLink = `${frontendUrl}/watch-along/${channelId}`;
        const messageContent = `🎬 Mời bạn xem anime cùng!\nNhấn vào link để tham gia: ${inviteLink}`;

        await this.messageService.sendMessage(BigInt(chatChannelId!), hostUserId, {
          content: messageContent,
        });
      } catch (chatErr: any) {
        logger.warn(`[WatchPartyService] Could not send chat invite: ${chatErr.message}`);
      }
    }

    // 2. Create notification for the invited user
    if (this.notificationService) {
      try {
        await this.notificationService.createAndPush(
          targetUserId,
          NotificationType.WATCH_PARTY_INVITE,
          'Lời mời xem cùng',
          `${hostDisplayName} đã mời bạn xem anime cùng`,
          {
            channelId,
            hostUsername,
            hostAvatar,
            chatChannelId,
          }
        );
      } catch (notifErr: any) {
        logger.warn(`[WatchPartyService] Could not send invite notification: ${notifErr.message}`);
      }
    }

    return { success: true, channelId, targetUserId: targetUserId.toString() };
  }

  private mapConfigToDto(config: InMemoryWatchRoom) {
    return {
      channelId: config.channelId,
      hostId: config.hostId,
      mediaId: config.mediaId,
      isPlaying: config.isPlaying,
      currentTimestamp: config.currentTimestamp,
      currentSourceUrl: config.currentSourceUrl,
      playlistQueue: config.playlistQueue,
      messages: config.messages,
      settings: config.settings,
      lastSyncedAt: config.lastSyncedAt,
    };
  }
}
