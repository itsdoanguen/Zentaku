import { RealtimeErrorCode } from '../types/errors';
import type {
  RoomJoinData,
  MessageSendData,
  PlaybackSeekData,
  MessageHistoryRequestData,
} from '../types/events';

export function validateRoomJoinPayload(data: any): {
  valid: boolean;
  error?: { code: RealtimeErrorCode; message: string };
  payload?: RoomJoinData;
} {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'room.join data must be an object',
      },
    };
  }

  if (typeof data.channelId !== 'string' || !data.channelId.trim()) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'channelId must be a non-empty string',
      },
    };
  }

  return {
    valid: true,
    payload: { channelId: data.channelId },
  };
}

export function validateMessageSendPayload(data: any): {
  valid: boolean;
  error?: { code: RealtimeErrorCode; message: string };
  payload?: MessageSendData;
} {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'message.send data must be an object',
      },
    };
  }

  if (typeof data.channelId !== 'string' || !data.channelId.trim()) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'channelId must be a non-empty string',
      },
    };
  }

  if (typeof data.content !== 'string' || !data.content.trim()) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'content must be a non-empty string',
      },
    };
  }

  if (!Array.isArray(data.attachments)) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'attachments must be an array',
      },
    };
  }

  if (data.attachments.length > 0) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'attachments must be empty array in MVP',
      },
    };
  }

  return {
    valid: true,
    payload: {
      channelId: data.channelId,
      content: data.content,
      replyToId: data.replyToId,
      attachments: [],
    },
  };
}

export function validateMessageHistoryRequestPayload(data: any): {
  valid: boolean;
  error?: { code: RealtimeErrorCode; message: string };
  payload?: MessageHistoryRequestData;
} {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'message.history.request data must be an object',
      },
    };
  }

  if (typeof data.channelId !== 'string' || !data.channelId.trim()) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'channelId must be a non-empty string',
      },
    };
  }

  const limit = data.limit || 50;
  if (typeof limit !== 'number' || limit < 1 || limit > 100) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'limit must be a number between 1 and 100',
      },
    };
  }

  return {
    valid: true,
    payload: {
      channelId: data.channelId,
      cursor: data.cursor,
      limit,
    },
  };
}

export function validatePlaybackSeekPayload(data: any): {
  valid: boolean;
  error?: { code: RealtimeErrorCode; message: string };
  payload?: PlaybackSeekData;
} {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'playback.seek data must be an object',
      },
    };
  }

  if (typeof data.channelId !== 'string' || !data.channelId.trim()) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'channelId must be a non-empty string',
      },
    };
  }

  if (typeof data.timestamp !== 'number' || data.timestamp < 0) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: 'timestamp must be a non-negative number (seconds)',
      },
    };
  }

  return {
    valid: true,
    payload: {
      channelId: data.channelId,
      timestamp: data.timestamp,
    },
  };
}

export const PAYLOAD_VALIDATORS: Record<
  string,
  (data: any) => { valid: boolean; error?: any; payload?: any }
> = {
  'room.join': validateRoomJoinPayload,
  'message.send': validateMessageSendPayload,
  'message.history.request': validateMessageHistoryRequestPayload,
  'playback.seek': validatePlaybackSeekPayload,
};

export function validateEventPayload(
  eventName: string,
  data: any
): {
  valid: boolean;
  error?: { code: RealtimeErrorCode; message: string };
  payload?: any;
} {
  const validator = PAYLOAD_VALIDATORS[eventName];
  if (!validator) {
    return { valid: true, payload: data };
  }

  return validator(data);
}
