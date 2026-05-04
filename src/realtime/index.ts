/**
 * Realtime Module
 * Phase 0: Architecture and Contract Foundation
 *
 * See: docs/plan/realtime/phases/phase-0-architecture-and-contract-technical-plan.md
 *
 * This module provides the foundational layer for realtime communication:
 * - Type definitions from v1 contracts
 * - Envelope validation (shape, event, version, requestId, auth, payload)
 * - Event payload validators
 * - Authorization checks against v1 matrix
 * - Gateway interface and base implementation
 * - Configuration framework
 *
 * Transport integration (Socket.IO) will be added in Phase 1.
 */

export * from './gateway';
export * from './types';
export * from './utils';
export * from './validators';
