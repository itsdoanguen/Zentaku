/**
 * Realtime Authorization Matrix v1
 */

export enum RealtimeRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
  NON_MEMBER = 'NON_MEMBER',
}

/**
 * User context for realtime authorization checks
 */
export interface RealtimeUserContext {
  userId: string;
  roles: RealtimeRole[];
  isHost?: boolean; // For watch-party contexts
}

/**
 * Room context for authorization checks
 */
export interface RealtimeRoomContext {
  channelId: string;
  channelType: 'TEXT' | 'WATCH_PARTY' | 'VOICE';
  hostId?: string; // For watch-party rooms
}

/**
 * Authorization matrix:
 * Maps event name -> set of roles that can perform that event
 *
 * Rules:
 * - Non-members are denied before payload processing.
 * - Member who is current room host can perform host-only controls.
 * - Moderator host-transfer behavior is governed by watch-party service policy.
 * - Permission checks happen at event handling time, not only during room.join.
 * - Private channels are 1-to-1 channels and must cap membership at exactly two participants.
 * - Private channel access still uses ChannelParticipant checks and communityId must remain null.
 */
export const AUTHORIZATION_MATRIX: Record<string, RealtimeRole[]> = {
  // Foundation events
  'room.join': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR, RealtimeRole.MEMBER],
  'room.leave': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR, RealtimeRole.MEMBER],

  // Chat events
  'message.send': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR, RealtimeRole.MEMBER],
  'message.history.request': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR, RealtimeRole.MEMBER],

  // Typing and read cursor (for presence)
  'typing.started': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR, RealtimeRole.MEMBER],
  'typing.stopped': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR, RealtimeRole.MEMBER],
  'read.cursor.update': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR, RealtimeRole.MEMBER],

  // Watch party (playback control is restricted)
  'playback.play': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR], // Member only if host
  'playback.pause': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR], // Member only if host
  'playback.seek': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR], // Member only if host
  'playback.sync': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR, RealtimeRole.MEMBER],
  'queue.update': [RealtimeRole.ADMIN, RealtimeRole.MODERATOR], // Member only if host
};

/**
 * Events that allow a room member (host) to perform normally restricted actions
 */
export const HOST_OVERRIDE_EVENTS = new Set([
  'playback.play',
  'playback.pause',
  'playback.seek',
  'queue.update',
]);

/**
 * Audit context for denied events
 */
export interface AuthorizationAuditLog {
  requestId: string;
  event: string;
  actorUserId: string;
  targetChannelId: string;
  errorCode: string;
  timestamp: number;
}
