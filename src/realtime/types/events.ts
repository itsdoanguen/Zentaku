/**
 * Realtime Event Catalog v1
 */

// ============================================================================
// Foundation Events
// ============================================================================

/**
 * connection.ready (server -> client)
 * Sent after successful authentication
 */
export interface ConnectionReadyData {
  sessionId: string;
  userId: string;
  capabilities: string[]; // e.g., ["chat", "watch-party"]
}

/**
 * room.join (client -> server)
 * Request to join a room (channel)
 */
export interface RoomJoinData {
  channelId: string;
}

/**
 * room.leave (client -> server)
 * Request to leave a room
 */
export interface RoomLeaveData {
  channelId: string;
  reason?: string;
}

/**
 * room.snapshot (server -> client)
 * Sent after room.join success or periodically
 */
export interface RoomSnapshotData {
  channelId: string;
  channelType: 'TEXT' | 'WATCH_PARTY' | 'VOICE';
  participants: Array<{
    userId: string;
    displayName: string;
  }>;
  lastMessageId?: string;
  serverTime: number;
}

// ============================================================================
// Chat Events
// ============================================================================

/**
 * message.send (client -> server)
 * Send a message to a channel
 */
export interface MessageSendData {
  channelId: string;
  content: string;
  replyToId?: string;
  attachments: []; // Reserved for future; must be empty array in MVP
}

/**
 * message.created (server -> room)
 * Broadcast when new message is created
 */
export interface MessageCreatedData {
  messageId: string;
  channelId: string;
  senderId: string;
  content: string;
  replyToId?: string;
  createdAt: string; // ISO-8601
}

/**
 * message.history.request (client -> server)
 * Request message history for a channel
 */
export interface MessageHistoryRequestData {
  channelId: string;
  cursor?: string;
  limit: number; // Default 50
}

/**
 * message.history.response (server -> client)
 * Return paginated message history
 */
export interface MessageHistoryResponseData {
  channelId: string;
  messages: Array<{
    messageId: string;
    senderId: string;
    content: string;
    replyToId?: string;
    createdAt: string; // ISO-8601
  }>;
  cursor?: string;
  hasMore: boolean;
}

// ============================================================================
// Typing and Read Cursor Events
// ============================================================================

/**
 * typing.started (client -> server)
 * Signal that user started typing (optional, for presence)
 */
export interface TypingStartedData {
  channelId: string;
}

/**
 * typing.stopped (client -> server)
 * Signal that user stopped typing
 */
export interface TypingStoppedData {
  channelId: string;
}

/**
 * read.cursor.update (client -> server)
 * Update read cursor position in channel
 */
export interface ReadCursorUpdateData {
  channelId: string;
  lastReadMessageId: string;
}

// ============================================================================
// Watch Party Events
// ============================================================================

/**
 * playback.play (client -> server)
 * Request to start playback (host/moderator only)
 */
export interface PlaybackPlayData {
  channelId: string;
  animeId: string;
  episodeId: string;
}

/**
 * playback.pause (client -> server)
 * Request to pause playback (host/moderator only)
 */
export interface PlaybackPauseData {
  channelId: string;
}

/**
 * playback.seek (client -> server)
 * Request to seek to timestamp (host/moderator only)
 */
export interface PlaybackSeekData {
  channelId: string;
  timestamp: number; // seconds
}

/**
 * playback.sync (client -> server)
 * Telemetry only; client sends its current playback state
 * Must not mutate authoritative playback state
 */
export interface PlaybackSyncData {
  channelId: string;
  currentTime: number; // seconds
  isPlaying: boolean;
  animeId: string;
  episodeId: string;
}

/**
 * queue.update (client -> server)
 * Update watch queue (host/moderator only)
 */
export interface QueueUpdateData {
  channelId: string;
  items: Array<{
    animeId: string;
    episodeId: string;
    title: string;
  }>;
}

// ============================================================================
// Event Registry Type
// ============================================================================

/**
 * Registry of all supported events with their payload types
 */
export type EventRegistry = {
  'connection.ready': ConnectionReadyData;
  'room.join': RoomJoinData;
  'room.leave': RoomLeaveData;
  'room.snapshot': RoomSnapshotData;

  'message.send': MessageSendData;
  'message.created': MessageCreatedData;
  'message.history.request': MessageHistoryRequestData;
  'message.history.response': MessageHistoryResponseData;

  'typing.started': TypingStartedData;
  'typing.stopped': TypingStoppedData;
  'read.cursor.update': ReadCursorUpdateData;

  'playback.play': PlaybackPlayData;
  'playback.pause': PlaybackPauseData;
  'playback.seek': PlaybackSeekData;
  'playback.sync': PlaybackSyncData;
  'queue.update': QueueUpdateData;
};

export type SupportedEventName = keyof EventRegistry;

export const SUPPORTED_EVENTS: Record<SupportedEventName, boolean> = {
  'connection.ready': true,
  'room.join': true,
  'room.leave': true,
  'room.snapshot': true,
  'message.send': true,
  'message.created': true,
  'message.history.request': true,
  'message.history.response': true,
  'typing.started': true,
  'typing.stopped': true,
  'read.cursor.update': true,
  'playback.play': true,
  'playback.pause': true,
  'playback.seek': true,
  'playback.sync': true,
  'queue.update': true,
};
