# Phase 0 Technical Plan: Architecture and Contract Finalization

## EX. ABOUT THE COMMENT ON THE CODE

MUST REMEMBER TO NOT EXPLAIN EVERYTHING BY COMMENT, ONLY EXPLAIN FOR COMPLEX THINGS
LET THE CODE EXPLAIN IT SELF, THE NAME AND OTHERS.

## 1. Objective

Finalize the realtime technical blueprint before implementation starts.

This phase must freeze:

1. Transport architecture choice
2. Socket authentication model
3. Event contract version 1
4. Realtime permission matrix
5. Observability baseline

## 2. Technical Scope

In scope:

1. Realtime contract definition and governance
2. Event envelope and validation policy
3. Error taxonomy and ack/nack protocol
4. Authorization model by event type
5. Correlation and telemetry standard

Out of scope:

1. Coding transport integration
2. Implementing room or message handlers
3. Database migrations

## 3. System Design Decisions

## 3.1 Realtime Boundary

Define clear boundaries:

1. Gateway layer handles connect and disconnect, envelope validation, and event routing.
2. Service layer handles business rules and permission checks.
3. Repository layer defines a hybrid persistence boundary: relational DB (MySQL) owns identity and relational metadata; a NoSQL document store is the canonical owner of message history and high-write chat datasets.

Transport decision for Phase 1 implementation:

1. Use Socket.IO v4 as the realtime transport.
2. Use socket.io-client v4 on the frontend.
3. Reuse Socket.IO rooms as the room abstraction on top of Channel.
4. Treat transient network failures as reconnectable with exponential backoff and jitter.
5. Treat auth failures as terminal for the current socket session and require REST re-authentication before reconnect.
6. Close the socket with policy-violation semantics after sending nack for auth failure.

## 3.2 Room Abstraction

Room identity is based on Channel:

1. Community channel rooms
2. Private rooms (for DM MVP path)
3. Watch-party rooms

## 3.3 Event Envelope v1

Standard envelope:

1. event: string
2. version: string
3. requestId: string
4. timestamp: number
5. data: object
6. error: object optional

## 3.4 Ack/Nack Protocol

This section is superseded by the canonical contract definitions in:

1. docs/plan/realtime/contracts/event-envelope-v1.md section 2 for envelope schema.
2. docs/plan/realtime/contracts/event-envelope-v1.md section 4 for ack and nack envelope.
3. docs/plan/realtime/contracts/error-codes-v1.md for error code taxonomy.

Governance rule:

1. If this phase-plan text conflicts with contract files, contract files are the source of truth.
2. Do not introduce alternative ack and nack field shapes in phase plans.

## 3.5 Transport Selection Output

Freeze the transport decision before Phase 1 coding starts:

1. Transport: Socket.IO v4.
2. Client library: socket.io-client v4.
3. Connection lifecycle: connect, authenticate, join room, emit validated events, reconnect on network loss only.
4. Failure handling: nack on auth/permission failures, then close the socket with policy-violation semantics.
5. Scaling assumption: single-instance development mode first, with Socket.IO adapter support deferred to the scaling plan if multi-instance deployment is added later.

## 4. File and Documentation Structure

Create and maintain:

1. docs/plan/realtime/contracts/event-envelope-v1.md
2. docs/plan/realtime/contracts/event-catalog-v1.md
3. docs/plan/realtime/contracts/error-codes-v1.md
4. docs/plan/realtime/contracts/authorization-matrix-v1.md
5. docs/plan/realtime/contracts/versioning-policy.md
6. docs/plan/realtime/contracts/auth-v1.md
7. docs/plan/realtime/contracts/reliability-v1.md
8. docs/plan/realtime/contracts/flow-control-v1.md
9. docs/plan/realtime/contracts/observability-v1.md

## 5. Work Breakdown

1. Freeze transport selection, reconnect policy, and socket close behavior.
2. Draft envelope and naming convention.
3. Draft event catalog for foundation, chat, watch-party.
4. Draft error code matrix and mapping.
5. Draft role and permission matrix.
6. Draft observability required fields.
7. Cross-review with BE and FE.
8. Freeze and tag contract v1.
9. Freeze storage boundary and author canonical hybrid persistence contract (docs/plan/realtime/contracts/hybrid-persistence-contract-v1.md).

## 6. Validation and Sign-off Checklist

1. Transport choice and reconnect behavior are frozen.
2. Every event has request payload and response payload defined.
3. Every event has explicit permission requirements.
4. Error codes are unique and stable.
5. Backward-compatibility rule is documented.
6. BE and FE both approve v1 docs.

## 7. Risks and Mitigation

Risk 1: Contract churn during Phase 1.
Mitigation: Freeze v1 and only allow additive changes.

Risk 2: Permission ambiguity for private rooms.
Mitigation: Explicit matrix for join, publish, and moderate actions.

Risk 3: Observability missing from early implementation.
Mitigation: Make log fields and metrics mandatory in gateway acceptance criteria.

## 8. Exit Criteria

1. Contract documents are complete and approved.
2. Event and error dictionaries are versioned.
3. No open blockers for foundation implementation.
4. Auth lifecycle and reconnect lifecycle are explicitly documented.
5. Rate limit and backpressure policies are explicitly documented.
6. Hybrid persistence contract is frozen and referenced by the Phase 0 gate.
