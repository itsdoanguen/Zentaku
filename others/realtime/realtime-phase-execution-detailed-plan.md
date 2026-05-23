# Realtime Phase Execution Detailed Plan

## EX. ABOUT THE COMMENT ON THE CODE

MUST REMEMBER TO NOT EXPLAIN EVERYTHING BY COMMENT, ONLY EXPLAIN FOR COMPLEX THINGS
LET THE CODE EXPLAIN IT SELF, THE NAME AND OTHERS.

## 1. Purpose

This document translates the master realtime roadmap into an execution-ready phase plan with:

- concrete implementation scope per phase
- system structure per phase
- proposed file and module structure
- dependencies and sequencing
- validation and exit criteria

Delivery order remains:

1. Shared realtime foundation
2. Community and chat MVP
3. Watch party MVP
4. Hardening and production readiness

## 2. Global Architecture Principles

1. Keep transport logic thin and stateless where possible.
2. Keep business rules in service layer, not in gateway handlers.
3. Reuse current DI and loader pattern from existing modules.
4. Reuse Channel as the shared room abstraction.
5. Reuse Message and participant models before creating new chat models.
6. Enforce authorization at both connection level and event level.
7. Keep REST as fallback for history and snapshots.

## EX. ABOUT THE COMMENT ON THE CODE

MUST REMEMBER TO NOT EXPLAIN EVERYTHING BY COMMENT, ONLY EXPLAIN FOR COMPLEX THINGS
LET THE CODE EXPLAIN IT SELF, THE NAME AND OTHERS.

## 3. Phase 0 - Architecture and Contract Finalization

Duration: 3-5 days

### 3.1 Objectives

1. Freeze realtime contract v1 before writing transport code.
2. Align backend and frontend on payload shape and event behavior.
3. Remove ambiguity around permission and error handling.

### 3.2 Detailed Work Items

1. Define transport choice and connection lifecycle with Socket.IO v4.
2. Define socket authentication handshake.
3. Define event envelope schema:
   - event
   - version
   - requestId
   - timestamp
   - data
   - error
4. Define acknowledgment shape (ack and nack).
5. Define realtime error code taxonomy and mapping.
6. Define role-based permission matrix by event.
7. Define observability baseline fields for logs and metrics.

### 3.3 System Structure Output

1. Realtime boundary between gateway and service layer.
2. Unified room model mapped to Channel.
3. Permission checkpoints defined for connect, join, publish.

### 3.4 File and Documentation Structure

1. Add contract docs under:
   - docs/plan/realtime/contracts
2. Add error matrix docs under:
   - docs/plan/realtime/contracts/errors
3. Add event catalog docs under:
   - docs/plan/realtime/contracts/events

### 3.5 Dependencies

1. No technical dependency.
2. Requires BE and FE agreement process.

### 3.6 Exit Criteria

1. Contract v1 is reviewed and approved.
2. Permission matrix is approved.
3. No unresolved open questions for MVP events.

## 4. Phase 1 - Shared Realtime Foundation

Duration: 1-2 weeks

### 4.1 Objectives

1. Introduce realtime transport into current backend safely.
2. Build reusable room and event foundation for all next phases.

### 4.2 Detailed Work Items

1. Add Socket.IO transport dependency.
2. Integrate socket server with existing HTTP server lifecycle.
3. Add realtime module and DI loader.
4. Add connection middleware for token authentication.
5. Add room join and leave orchestration.
6. Add event dispatcher with schema validation.
7. Add baseline events:
   - connection.ready
   - room.join
   - room.leave
   - room.snapshot
   - error
8. Add structured logging and request correlation.
9. Add basic counters and latency metrics.

### 4.3 System Structure Output

1. Transport layer:
   - connection manager
   - auth middleware
   - inbound event ingress
2. Application layer:
   - room orchestration service
   - event dispatcher
3. Domain layer:
   - membership and role validation
4. Infrastructure layer:
   - adapters, logging, metrics

### 4.4 Proposed File Structure

1. Extend existing files:
   - src/server.ts
   - src/config/container.ts
   - src/config/loaders/index.ts
2. Add realtime module:
   - src/modules/realtime/index.ts
   - src/modules/realtime/gateway/realtime.gateway.ts
   - src/modules/realtime/gateway/realtime.middleware.ts
   - src/modules/realtime/contracts/event-envelope.ts
   - src/modules/realtime/contracts/events.ts
   - src/modules/realtime/services/room-orchestrator.service.ts
   - src/modules/realtime/services/event-dispatcher.service.ts
   - src/modules/realtime/validators/realtime.validator.ts
3. Add loader:
   - src/config/loaders/realtime.loader.ts

### 4.5 Dependencies

1. Depends on Phase 0 contract freeze.

### 4.6 Exit Criteria

1. Two authenticated clients can join one room and receive broadcast.
2. Join and publish are blocked when authorization fails.
3. Existing REST endpoints are unaffected.

## 5. Phase 2 - Community and Chat MVP

Duration: 2-3 weeks

### 5.1 Objectives

1. Deliver first business slice using the realtime foundation.
2. Implement core community and chat flows end-to-end.

### 5.2 Detailed Work Items

1. Community domain APIs:
   - create community
   - update community
   - list communities
   - get community detail
   - join community
   - leave community
   - invite code flow
2. Channel domain APIs:
   - create channel
   - list channels by community
   - private channel support for MVP DM path
3. Message domain APIs:
   - send message
   - list message history with pagination
   - reply support
   - read cursor update
4. Storage boundary and schema design:
   - define hybrid persistence boundary (MySQL for relational metadata; NoSQL for message history)
   - design NoSQL message document schema and indexes
   - define opaque cursor encoding and pagination semantics
   - implement repository abstraction and reconciliation strategy
5. Realtime chat events:
   - message.created
   - typing.started
   - typing.stopped
   - presence.joined
   - presence.left
   - read.cursor.updated
6. Add permission checks:
   - community-level role checks
   - channel participant checks
7. Add validations and error mapping parity between REST and socket.

### 5.3 System Structure Output

1. Community aggregate built on Community and CommunityMember.
2. Channel aggregate built on Channel and ChannelParticipant.
3. Message history persists in a NoSQL document store (canonical owner); relational DB stores identity and light sidecar metadata (e.g., lastMessageId, counters). Implement repository abstractions to hide dual-write and read patterns.

### 5.4 Proposed File Structure

1. New modules:
   - src/modules/community
   - src/modules/channel
   - src/modules/message
2. Each module follows existing pattern:
   - controllers
   - services
   - repositories
   - dto
   - validators
   - routes
3. Suggested module files:
   - src/modules/community/community.routes.ts
   - src/modules/community/controllers/community.controller.ts
   - src/modules/community/services/community.service.ts
   - src/modules/community/repositories/community.repository.ts
   - src/modules/channel/channel.routes.ts
   - src/modules/channel/controllers/channel.controller.ts
   - src/modules/channel/services/channel.service.ts
   - src/modules/channel/repositories/channel.repository.ts
   - src/modules/message/message.routes.ts
   - src/modules/message/controllers/message.controller.ts
   - src/modules/message/services/message.service.ts
   - src/modules/message/repositories/message.repository.ts
4. New loaders:
   - src/config/loaders/community.loader.ts
   - src/config/loaders/channel.loader.ts
   - src/config/loaders/message.loader.ts
5. Route registration update:
   - src/routes/index.ts

### 5.5 Dependencies

1. Depends on Phase 1 realtime foundation.

### 5.6 Exit Criteria

1. User can create community, join channel, and chat in realtime.
2. Unauthorized publish or room subscription is blocked.
3. Message history and read cursor behavior works with persistence.

## 6. Phase 3 - Watch Party MVP

Duration: 2 weeks

### 6.1 Objectives

1. Add synchronized watch-room behavior using existing room and chat primitives.
2. Keep server-authoritative playback state transitions.

### 6.2 Detailed Work Items

1. Watch room APIs:
   - create watch room
   - configure room settings
   - attach media and source
   - assign host
   - transfer host
   - fetch room snapshot
2. Playback events:
   - playback.play
   - playback.pause
   - playback.seek
   - playback.sync
   - playback.state.changed
   - queue.update
3. Persistence and consistency:
   - update isPlaying
   - update currentTimestamp
   - update currentSourceUrl
   - update playlistQueue
   - update lastSyncedAt
4. Authority and conflict control:
   - host or moderator-only control events
   - serialized state mutation pipeline
5. Late joiner sync:
   - snapshot send on join
   - catch-up logic on client side contract

### 6.3 System Structure Output

1. Watch-party service layer on top of shared realtime gateway.
2. Playback state machine with authority guard.
3. Snapshot and resync path for new room participants.

### 6.4 Proposed File Structure

1. New module:
   - src/modules/watch-party
2. Suggested files:
   - src/modules/watch-party/watch-party.routes.ts
   - src/modules/watch-party/controllers/watch-party.controller.ts
   - src/modules/watch-party/services/watch-party.service.ts
   - src/modules/watch-party/repositories/watch-room-config.repository.ts
   - src/modules/watch-party/dto/watch-party.dto.ts
   - src/modules/watch-party/validators/watch-party.validator.ts
3. Realtime handlers:
   - src/modules/realtime/handlers/watch-party.handler.ts
4. Loader:
   - src/config/loaders/watch-party.loader.ts

### 6.5 Dependencies

1. Depends on Phase 1 foundation and Phase 2 room and message capabilities.

### 6.6 Exit Criteria

1. Multiple clients in one room see consistent playback state.
2. Host transfer and authority rules are enforced.
3. Late joiners receive snapshot and sync correctly.

## 7. Phase 4 - Hardening and Production Readiness

Duration: 1 week

### 7.1 Objectives

1. Validate reliability, performance, and security before go-live.
2. Establish observability and operational runbooks.

### 7.2 Detailed Work Items

1. Reliability:
   - reconnect and resync behavior
   - dead connection cleanup
   - idempotency handling for critical events
2. Performance:
   - chat burst load test
   - playback control burst load test
   - latency and error profiling
3. Security:
   - permission bypass tests
   - malformed payload rejection tests
   - event-level rate limiting validation
4. Operations:
   - dashboard and alert setup
   - incident runbook for realtime failures

### 7.3 System Structure Output

1. Operational guardrails and visibility for realtime production usage.

### 7.4 Proposed File Structure

1. Test suites:
   - test/realtime/unit
   - test/realtime/integration
   - test/realtime/e2e
2. QA harness:
   - test/realtime/harness/socket-client-scenarios.ts
3. Ops documentation:
   - docs/plan/realtime/ops/realtime-runbook.md
   - docs/plan/realtime/ops/realtime-slo.md

### 7.5 Dependencies

1. Depends on all previous implementation phases.

### 7.6 Exit Criteria

1. SLO target for event latency and failure rate is met.
2. Security and reliability checklist is complete.
3. Go-live runbook and alerts are ready.

## 8. Cross-Phase Dependency Graph

1. Phase 0 -> required by Phase 1.
2. Phase 1 -> required by Phase 2 and Phase 3.
3. Phase 2 -> required by Phase 3 for shared chat and membership primitives.
4. Phase 3 -> required by Phase 4 final validation.
5. Phase 4 -> final go-live gate.

## 9. Validation Plan Per Phase

1. Type-check and build gate after each phase.
2. Unit test gate for service-layer logic.
3. Integration test gate for API and realtime interactions.
4. Backend-only multi-client socket harness for FE-independent verification.
5. Regression smoke test for existing modules before sign-off.

## 10. Definition of Done

A phase is done only when:

1. planned deliverables are implemented
2. exit criteria pass
3. test gates pass
4. documentation for that phase is updated
5. no open blocker remains for the next phase
