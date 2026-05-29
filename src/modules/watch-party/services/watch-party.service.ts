import crypto from 'crypto';
import type { CreateWatchRoomDto, UpdatePlaybackStateDto } from '../dto/watch-party.dto';

export interface InMemoryWatchRoom {
  channelId: string;
  hostId: string;
  mediaId: string | null;
  isPlaying: boolean;
  currentTimestamp: number;
  currentSourceUrl: string | null;
  playlistQueue: any[];
  settings: Record<string, unknown>;
  lastSyncedAt: Date;
}

export class WatchPartyService {
  private rooms: Map<string, InMemoryWatchRoom>;

  constructor() {
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
      settings: data.settings || {},
      lastSyncedAt: new Date(),
    };

    this.rooms.set(channelId, config);

    return this.mapConfigToDto(config);
  }

  async getWatchRoom(channelId: string) {
    const config = this.rooms.get(channelId);
    if (!config) {
      throw Object.assign(new Error('Watch room not found'), { code: 'ROOM_NOT_FOUND' });
    }
    return this.mapConfigToDto(config);
  }

  async updatePlaybackState(channelId: string, userId: bigint, data: UpdatePlaybackStateDto) {
    const config = this.rooms.get(channelId);
    if (!config) {
      throw Object.assign(new Error('Watch room not found'), { code: 'ROOM_NOT_FOUND' });
    }

    if (config.hostId !== userId.toString()) {
      throw Object.assign(new Error('Only host can control playback'), { code: 'HOST_REQUIRED' });
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
      throw Object.assign(new Error('Watch room not found'), { code: 'ROOM_NOT_FOUND' });
    }

    if (config.hostId !== userId.toString()) {
      throw Object.assign(new Error('Only host can change episode'), { code: 'HOST_REQUIRED' });
    }

    config.currentSourceUrl = newSourceUrl;
    config.currentTimestamp = 0;
    config.isPlaying = true; // Auto play new episode
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
      throw Object.assign(new Error('Watch room not found'), { code: 'ROOM_NOT_FOUND' });
    }
    // Return snapshot for late joiners
    return this.mapConfigToDto(config);
  }

  async leaveWatchRoom(_channelId: string, _userId: bigint) {
    // Basic leave, no host transfer logic for MVP
    return { success: true };
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
      settings: config.settings,
      lastSyncedAt: config.lastSyncedAt,
    };
  }
}
