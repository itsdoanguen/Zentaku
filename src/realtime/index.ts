/**
 * Realtime Module
 *
 * This module provides the foundational layer for realtime communication:
 * - Type definitions from v1 contracts
 * - Envelope validation (shape, event, version, requestId, auth, payload)
 * - Event payload validators
 * - Authorization checks against v1 matrix
 * - Gateway interface and base implementation
 * - Configuration framework
 */

export * from './gateway';
export * from './types';
export * from './utils';
export * from './validators';
