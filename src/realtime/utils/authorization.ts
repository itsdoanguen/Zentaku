import {
  AUTHORIZATION_MATRIX,
  HOST_OVERRIDE_EVENTS,
  RealtimeRole,
  type AuthorizationAuditLog,
  type RealtimeRoomContext,
  type RealtimeUserContext,
} from '../types/authorization';
import { RealtimeErrorCode } from '../types/errors';

export function checkEventAuthorization(
  eventName: string,
  userContext: RealtimeUserContext,
  _roomContext: RealtimeRoomContext
): {
  authorized: boolean;
  errorCode?: RealtimeErrorCode;
  errorMessage?: string;
} {
  if (userContext.roles.includes(RealtimeRole.NON_MEMBER)) {
    return {
      authorized: false,
      errorCode: RealtimeErrorCode.ROOM_ACCESS_DENIED,
      errorMessage: 'User is not a member of this room',
    };
  }

  const allowedRoles = AUTHORIZATION_MATRIX[eventName];
  if (!allowedRoles) {
    return {
      authorized: false,
      errorCode: RealtimeErrorCode.EVENT_NOT_SUPPORTED,
      errorMessage: `Event '${eventName}' is not defined in authorization matrix`,
    };
  }

  const hasRequiredRole = userContext.roles.some((role) => allowedRoles.includes(role));

  if (!hasRequiredRole) {
    if (HOST_OVERRIDE_EVENTS.has(eventName) && userContext.isHost) {
      return { authorized: true };
    }

    return {
      authorized: false,
      errorCode: RealtimeErrorCode.PERMISSION_DENIED,
      errorMessage: `User role does not permit event '${eventName}'`,
    };
  }

  return { authorized: true };
}

export function resolveUserRoles(
  _userId: string,
  communityRole?: RealtimeRole,
  channelRole?: RealtimeRole,
  isHostOfRoom?: boolean
): {
  roles: RealtimeRole[];
  isHost: boolean;
} {
  const roles: RealtimeRole[] = [];

  if (communityRole) {
    roles.push(communityRole);
  }

  if (channelRole) {
    roles.push(channelRole);
  }

  if (roles.length === 0) {
    roles.push(RealtimeRole.NON_MEMBER);
  }

  const isHost = isHostOfRoom || false;

  return { roles, isHost };
}

export function createAuthorizationAuditLog(
  requestId: string,
  event: string,
  actorUserId: string,
  targetChannelId: string,
  errorCode: RealtimeErrorCode
): AuthorizationAuditLog {
  return {
    requestId,
    event,
    actorUserId,
    targetChannelId,
    errorCode,
    timestamp: Date.now(),
  };
}

export function formatAuditLog(log: AuthorizationAuditLog): string {
  return (
    `[AUTHZ_DENY] requestId=${log.requestId} event=${log.event} ` +
    `actor=${log.actorUserId} room=${log.targetChannelId} error=${log.errorCode}`
  );
}

export function checkWatchPartyPermission(
  eventName: string,
  userContext: RealtimeUserContext,
  roomContext: RealtimeRoomContext
): {
  authorized: boolean;
  errorCode?: RealtimeErrorCode;
  errorMessage?: string;
} {
  if (eventName === 'room.join') {
    return { authorized: true };
  }

  const hostRestrictedEvents = [
    'playback.play',
    'playback.pause',
    'playback.seek',
    'queue.update',
    'playback.change_episode',
    'room.kick',
  ];
  if (hostRestrictedEvents.includes(eventName)) {
    const isAdmin = userContext.roles.includes(RealtimeRole.ADMIN);
    const isModerator = userContext.roles.includes(RealtimeRole.MODERATOR);
    const isHost = userContext.isHost;

    if (isAdmin || isModerator || isHost) {
      return { authorized: true };
    }

    return {
      authorized: false,
      errorCode: RealtimeErrorCode.HOST_REQUIRED,
      errorMessage: 'Only room host, moderator, or admin can perform this action',
    };
  }

  return checkEventAuthorization(eventName, userContext, roomContext);
}
