/**
 * Realtime Error Codes v1
 * Defined in: docs/plan/realtime/contracts/error-codes-v1.md
 */

export enum RealtimeErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROOM_ACCESS_DENIED = 'ROOM_ACCESS_DENIED',
  HOST_REQUIRED = 'HOST_REQUIRED',
  EVENT_NOT_SUPPORTED = 'EVENT_NOT_SUPPORTED',
  EVENT_VERSION_UNSUPPORTED = 'EVENT_VERSION_UNSUPPORTED',
  PAYLOAD_INVALID = 'PAYLOAD_INVALID',
  REQUEST_ID_INVALID = 'REQUEST_ID_INVALID',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  SNAPSHOT_UNAVAILABLE = 'SNAPSHOT_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',
  BACKPRESSURE_DROPPED = 'BACKPRESSURE_DROPPED',
  STATE_CONFLICT = 'STATE_CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DEPENDENCY_UNAVAILABLE = 'DEPENDENCY_UNAVAILABLE',
}

export interface RealtimeError {
  code: RealtimeErrorCode;
  message: string;
  details?: Record<string, any>;
}

export const ErrorCodeDescriptions: Record<RealtimeErrorCode, string> = {
  [RealtimeErrorCode.AUTH_REQUIRED]: 'Authentication token is missing',
  [RealtimeErrorCode.AUTH_INVALID]: 'Token format or signature is invalid',
  [RealtimeErrorCode.AUTH_EXPIRED]: 'Authentication token has expired',
  [RealtimeErrorCode.PERMISSION_DENIED]: 'User lacks required role or privilege',
  [RealtimeErrorCode.ROOM_ACCESS_DENIED]: 'User cannot access target room',
  [RealtimeErrorCode.HOST_REQUIRED]: 'Playback control requires host or moderator',
  [RealtimeErrorCode.EVENT_NOT_SUPPORTED]: 'Unknown event name',
  [RealtimeErrorCode.EVENT_VERSION_UNSUPPORTED]: 'Event version not accepted',
  [RealtimeErrorCode.PAYLOAD_INVALID]: 'Event data payload does not match schema',
  [RealtimeErrorCode.REQUEST_ID_INVALID]: 'Missing or malformed requestId',
  [RealtimeErrorCode.ROOM_NOT_FOUND]: 'Target room does not exist',
  [RealtimeErrorCode.MESSAGE_NOT_FOUND]: 'Referenced message does not exist',
  [RealtimeErrorCode.SNAPSHOT_UNAVAILABLE]: 'Room snapshot could not be generated',
  [RealtimeErrorCode.RATE_LIMITED]: 'Sender exceeded event rate limit',
  [RealtimeErrorCode.BACKPRESSURE_DROPPED]: 'Event dropped due to server backpressure',
  [RealtimeErrorCode.STATE_CONFLICT]: 'Concurrent state update conflict detected',
  [RealtimeErrorCode.INTERNAL_ERROR]: 'Unexpected server error',
  [RealtimeErrorCode.DEPENDENCY_UNAVAILABLE]: 'Required service or datastore unavailable',
};
