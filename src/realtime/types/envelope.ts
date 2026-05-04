/**
 * Realtime Event Envelope v1
 * Defined in: docs/plan/realtime/contracts/event-envelope-v1.md
 */

import type { RealtimeError } from './errors';

export const ENVELOPE_VERSION = '1.0';

export interface EventEnvelope<T = any> {
  event: string;
  version: string;
  requestId: string;
  timestamp: number;
  data?: T;
  error?: RealtimeError;
}

export interface AckEnvelope {
  event: 'ack';
  version: string;
  requestId: string;
  timestamp: number;
  data: {
    sourceEvent: string;
  };
}

export interface NackEnvelope {
  event: 'nack';
  version: string;
  requestId: string;
  timestamp: number;
  error: RealtimeError;
}

export type RealtimeEnvelope<T = any> = EventEnvelope<T> | AckEnvelope | NackEnvelope;

/**
 * Validation order for inbound events:
 * 1. Envelope shape validation.
 * 2. event and version validation.
 * 3. requestId validation.
 * 4. Auth and permission validation.
 * 5. Event-specific payload validation.
 */

export interface EnvelopeValidationContext {
  maxPayloadSize?: number; // bytes
  allowedVersions?: string[];
}
