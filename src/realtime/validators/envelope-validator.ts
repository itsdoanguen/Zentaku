import { v4 as uuidv4, validate as validateUUID } from 'uuid';
import type { EventEnvelope, AckEnvelope, NackEnvelope, RealtimeEnvelope } from '../types/envelope';
import { ENVELOPE_VERSION } from '../types/envelope';
import { RealtimeErrorCode } from '../types/errors';

export function validateEnvelopeShape(data: any): {
  valid: boolean;
  error?: string;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Envelope must be an object' };
  }

  if (typeof data.event !== 'string') {
    return { valid: false, error: 'event field must be a string' };
  }

  if (typeof data.version !== 'string') {
    return { valid: false, error: 'version field must be a string' };
  }

  if (typeof data.requestId !== 'string') {
    return { valid: false, error: 'requestId field must be a string' };
  }

  if (typeof data.timestamp !== 'number') {
    return { valid: false, error: 'timestamp field must be a number' };
  }

  return { valid: true };
}

export function validateEventAndVersion(
  eventName: string,
  version: string,
  supportedEvents: Set<string>,
  allowedVersions: string[] = [ENVELOPE_VERSION]
): {
  valid: boolean;
  error?: { code: RealtimeErrorCode; message: string };
} {
  if (!supportedEvents.has(eventName)) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.EVENT_NOT_SUPPORTED,
        message: `Event '${eventName}' is not supported`,
      },
    };
  }

  if (!allowedVersions.includes(version)) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.EVENT_VERSION_UNSUPPORTED,
        message: `Event version '${version}' is not accepted`,
      },
    };
  }

  return { valid: true };
}

export function validateRequestId(requestId: string): {
  valid: boolean;
  error?: { code: RealtimeErrorCode; message: string };
} {
  if (!requestId || typeof requestId !== 'string') {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.REQUEST_ID_INVALID,
        message: 'requestId must be a non-empty string',
      },
    };
  }

  if (!validateUUID(requestId)) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.REQUEST_ID_INVALID,
        message: 'requestId must be a valid UUID',
      },
    };
  }

  return { valid: true };
}

export function validatePayload(
  eventName: string,
  payload: any,
  schema?: Record<string, any>
): {
  valid: boolean;
  error?: { code: RealtimeErrorCode; message: string };
} {
  if (!schema) {
    if (payload !== undefined && payload !== null && typeof payload !== 'object') {
      return {
        valid: false,
        error: {
          code: RealtimeErrorCode.PAYLOAD_INVALID,
          message: 'Event data must be an object',
        },
      };
    }
    return { valid: true };
  }

  if (typeof payload !== 'object') {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: `Event '${eventName}' payload must be an object`,
      },
    };
  }

  return { valid: true };
}

export function validateInboundEnvelope(
  data: any,
  options: {
    supportedEvents: Set<string>;
    allowedVersions?: string[];
    payloadSchema?: Record<string, any>;
  }
): {
  valid: boolean;
  error?: { code: RealtimeErrorCode; message: string };
  envelope?: EventEnvelope;
} {
  const shapeCheck = validateEnvelopeShape(data);
  if (!shapeCheck.valid) {
    return {
      valid: false,
      error: {
        code: RealtimeErrorCode.PAYLOAD_INVALID,
        message: shapeCheck.error || 'Invalid envelope shape',
      },
    };
  }

  const eventCheck = validateEventAndVersion(
    data.event,
    data.version,
    options.supportedEvents,
    options.allowedVersions
  );
  if (!eventCheck.valid) {
    return { valid: false, error: eventCheck.error };
  }

  const requestIdCheck = validateRequestId(data.requestId);
  if (!requestIdCheck.valid) {
    return { valid: false, error: requestIdCheck.error };
  }

  if (data.data !== undefined && data.data !== null) {
    const payloadCheck = validatePayload(data.event, data.data, options.payloadSchema);
    if (!payloadCheck.valid) {
      return { valid: false, error: payloadCheck.error };
    }
  }

  return {
    valid: true,
    envelope: data as EventEnvelope,
  };
}

export function generateRequestId(): string {
  return uuidv4();
}

export function createAckEnvelope(
  requestId: string,
  sourceEvent: string,
  timestamp?: number
): AckEnvelope {
  return {
    event: 'ack',
    version: ENVELOPE_VERSION,
    requestId,
    timestamp: timestamp || Date.now(),
    data: {
      sourceEvent,
    },
  };
}

export function createNackEnvelope(
  requestId: string,
  error: {
    code: RealtimeErrorCode;
    message: string;
    details?: Record<string, any>;
  },
  timestamp?: number
): NackEnvelope {
  return {
    event: 'nack',
    version: ENVELOPE_VERSION,
    requestId,
    timestamp: timestamp || Date.now(),
    error,
  };
}

export function isAckEnvelope(envelope: RealtimeEnvelope): envelope is AckEnvelope {
  return envelope.event === 'ack';
}

export function isNackEnvelope(envelope: RealtimeEnvelope): envelope is NackEnvelope {
  return envelope.event === 'nack';
}

export function isEventEnvelope<T = any>(envelope: RealtimeEnvelope): envelope is EventEnvelope<T> {
  return envelope.event !== 'ack' && envelope.event !== 'nack';
}
