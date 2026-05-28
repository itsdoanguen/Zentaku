export interface CreateWatchRoomDto {
  channelId: string;
  mediaId?: string;
  currentSourceUrl?: string;
  settings?: Record<string, unknown>;
}

export interface UpdatePlaybackStateDto {
  action: 'play' | 'pause' | 'seek';
  timestamp?: number;
}
