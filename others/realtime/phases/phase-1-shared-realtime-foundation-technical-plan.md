# Phase 1 Technical Plan: Shared Realtime Foundation

## EX. ABOUT THE COMMENT ON THE CODE

MUST REMEMBER TO NOT EXPLAIN EVERYTHING BY COMMENT, ONLY EXPLAIN FOR COMPLEX THINGS
LET THE CODE EXPLAIN IT SELF, THE NAME AND OTHERS.

## 1. Objective

Implement a production-safe realtime foundation that can be reused by community chat and watch-party features.

## 2. Technical Scope

In scope:

1. Socket.IO transport integration with existing Node HTTP lifecycle
2. Realtime module skeleton and DI loader integration
3. Socket authentication middleware
4. Room join and leave orchestration
5. Event dispatcher and baseline events
6. Structured logging and baseline metrics

Out of scope:

1. Full community CRUD
2. Full message domain APIs
3. Watch-party playback business rules

## 3. Architecture Slice

## 3.1 Transport Layer

Responsibilities:

1. Accept Socket.IO client connections.
2. Authenticate during handshake.
3. Route validated events to dispatcher.
4. Preserve Socket.IO room semantics for Channel-backed rooms.

Expected files:

1. src/modules/realtime/gateway/realtime.gateway.ts
2. src/modules/realtime/gateway/realtime.middleware.ts

## 3.2 Application Layer

Responsibilities:

1. Handle room join and leave use cases.
2. Emit standard snapshot and error events.
3. Dispatch incoming events to registered handlers.

Expected files:

1. src/modules/realtime/services/room-orchestrator.service.ts
2. src/modules/realtime/services/event-dispatcher.service.ts

## 3.3 Contract Layer

Responsibilities:

1. Event envelope type safety.
2. Event name registry.
3. Payload validation primitives.

Expected files:

1. src/modules/realtime/contracts/event-envelope.ts
2. src/modules/realtime/contracts/events.ts
3. src/modules/realtime/validators/realtime.validator.ts

## 4. Integration Points in Existing Codebase

1. src/server.ts
   - Attach socket server to existing server lifecycle.
2. src/config/container.ts
   - Register realtime core services.
3. src/config/loaders/index.ts
   - Register and initialize realtime loader in the proper order.
4. src/config/loaders/realtime.loader.ts
   - Wire repository and service dependencies.

## 4.1 Loader Order and Registration Rules

1. Realtime loader is initialized after infrastructure and auth primitives are available.
2. Loader order is fixed as infrastructure -> realtime -> community -> channel -> message -> watch-party.
3. Event dispatcher registration is centralized and does not use module.ts initialization.
4. Domain modules register handlers through DI-resolved dispatcher during their loader execution.

## 4.5 Transport and Loader Decision Notes

1. Use Socket.IO v4 and socket.io-client v4 for the realtime transport.
2. Use a single dispatcher registry as the handoff point between realtime and domain loaders.
3. Do not register handlers from module constructors or top-level module code.
4. Verify startup with a log line that confirms the number of registered dispatcher handlers.

## 4.2 Connection and Room Join Sequence

1. Client connects and sends token according to contracts/auth-v1.md.
2. Server validates token and builds socket user context.
3. On success, server emits connection.ready.
4. Client emits room.join with channelId.
5. Server validates membership and permissions according to contracts/authorization-matrix-v1.md.
6. On success, server emits room.snapshot.
7. On failure, server emits nack with error code from contracts/error-codes-v1.md, then closes the socket on auth or policy violations.
8. Reconnect is allowed only for transient transport failures, not for auth failures.

## 4.3 Contract Dependencies

Phase 1 implementation must follow:

1. contracts/event-envelope-v1.md
2. contracts/event-catalog-v1.md
3. contracts/error-codes-v1.md
4. contracts/auth-v1.md
5. contracts/reliability-v1.md
6. contracts/flow-control-v1.md
7. contracts/observability-v1.md

## 5. Work Breakdown

1. Add Socket.IO dependency and basic bootstrap.
2. Create module skeleton and loader.
3. Implement auth middleware and socket context model.
4. Implement room.join and room.leave handlers.
5. Implement room.snapshot and standardized error emission.
6. Implement event dispatcher with schema checks.
7. Add structured logs with requestId correlation.
8. Add baseline metrics: connected clients, join attempts, join failures, dispatch latency.

## 6. Test Strategy

Unit tests:

1. Auth middleware token handling.
2. Dispatcher validation behavior.

Integration tests:

1. Connect and authenticate client.
2. Join room success.
3. Join room unauthorized.
4. Broadcast to joined clients.
5. Auth failure closes the socket after nack delivery.

Smoke tests:

1. REST routes still start and work.
2. Graceful shutdown closes both HTTP and realtime layers.

## 7. Risks and Mitigation

Risk 1: Startup lifecycle regression.
Mitigation: Add smoke test and staged bootstrap fallback.

Risk 2: Auth mismatch between HTTP and socket.
Mitigation: Reuse existing token verification path and shared context object.

Risk 3: Event handler sprawl.
Mitigation: Central dispatcher registry and strict event namespace.

## 8. Exit Criteria

1. Two authenticated clients can join a room and receive broadcast through Socket.IO.
2. Unauthorized joins and publishes are blocked with standard errors.
3. Logging and metrics are visible for core events.
4. Existing REST behavior is unaffected.
5. Connection, join, nack, and reconnect behaviors match the contract pack.
