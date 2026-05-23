# Realtime Ticket Breakdown by Phase

## EX. ABOUT THE COMMENT ON THE CODE

MUST REMEMBER TO NOT EXPLAIN EVERYTHING BY COMMENT, ONLY EXPLAIN FOR COMPLEX THINGS
LET THE CODE EXPLAIN IT SELF, THE NAME AND OTHERS.

## 1. Estimation Model

- Story Point scale: 1, 2, 3, 5, 8, 13
- Person-day estimate is for backend engineering only
- QA and FE effort are tracked separately unless explicitly listed
- Team assumption: 2 BE engineers, 1 QA shared

## 2. Phase 0 - Architecture and Contract Finalization

### Epic P0-E1: Realtime Contract v1 and Governance

#### Story P0-E1-S1: Define event contract v1

- Task P0-E1-S1-T1: Define event envelope schema and naming conventions
  - Estimate: 2 SP, 0.5 day
- Task P0-E1-S1-T2: Define foundation event catalog and payload schema
  - Estimate: 3 SP, 1 day
- Task P0-E1-S1-T3: Define chat and watch-party event schema drafts
  - Estimate: 5 SP, 1.5 days

Story total: 10 SP, 3 days

#### Story P0-E1-S2: Define realtime error and ack model

- Task P0-E1-S2-T1: Define ack and nack response shape
  - Estimate: 2 SP, 0.5 day
- Task P0-E1-S2-T2: Define realtime error code matrix
  - Estimate: 3 SP, 1 day
- Task P0-E1-S2-T3: Map errors to REST parity behaviors
  - Estimate: 2 SP, 0.5 day

Story total: 7 SP, 2 days

#### Story P0-E1-S3: Define authorization and observability standards

- Task P0-E1-S3-T1: Define role-event permission matrix
  - Estimate: 3 SP, 1 day
- Task P0-E1-S3-T2: Define correlation and structured log fields
  - Estimate: 2 SP, 0.5 day
- Task P0-E1-S3-T3: Define minimum metrics and alert candidates
  - Estimate: 2 SP, 0.5 day

Story total: 7 SP, 2 days

#### Story P0-E1-S4: Define auth, recovery, and flow-control contracts

- Task P0-E1-S4-T1: Define socket auth lifecycle contract, transport close behavior, and token expiry behavior
  - Estimate: 3 SP, 1 day
- Task P0-E1-S4-T2: Define reconnect and recovery contract with duplicate handling rules
  - Estimate: 3 SP, 1 day
- Task P0-E1-S4-T3: Define flow-control and backpressure baseline
  - Estimate: 2 SP, 0.5 day

Story total: 8 SP, 2.5 days

#### Story P0-E1-S5: Define hybrid persistence contract

- Task P0-E1-S5-T1: Draft hybrid persistence contract document and ownership boundaries (MySQL vs NoSQL)
  - Estimate: 3 SP, 1 day
- Task P0-E1-S5-T2: Align FE and BE on cursor semantics, idempotency, and reconciliation strategy
  - Estimate: 3 SP, 1 day

Story total: 6 SP, 2 days

Phase 0 total: 32 SP, 9.5 person-days

## 3. Phase 1 - Shared Realtime Foundation

### Epic P1-E1: Realtime Transport and Lifecycle Integration

#### Story P1-E1-S1: Attach realtime server to application lifecycle

- Task P1-E1-S1-T1: Add Socket.IO transport dependency and bootstrap wiring in server lifecycle
  - Estimate: 5 SP, 1.5 days
- Task P1-E1-S1-T2: Implement graceful shutdown for socket layer
  - Estimate: 2 SP, 0.5 day
- Task P1-E1-S1-T3: Add smoke startup checks and rollback safety
  - Estimate: 2 SP, 0.5 day

Story total: 9 SP, 2.5 days

#### Story P1-E1-S2: Build realtime module and DI integration

- Task P1-E1-S2-T1: Create realtime module skeleton and exports
  - Estimate: 3 SP, 1 day
- Task P1-E1-S2-T2: Add realtime loader and container registrations
  - Estimate: 3 SP, 1 day
- Task P1-E1-S2-T3: Wire module initialization order in loader index
  - Estimate: 2 SP, 0.5 day

Story total: 8 SP, 2.5 days

### Epic P1-E2: Authenticated Room Foundation and Event Dispatcher

#### Story P1-E2-S1: Implement socket authentication and user context

- Task P1-E2-S1-T1: Implement token handshake middleware
  - Estimate: 5 SP, 1.5 days
- Task P1-E2-S1-T2: Build unauthorized flow and standardized error emissions
  - Estimate: 2 SP, 0.5 day
- Task P1-E2-S1-T3: Add middleware unit tests
  - Estimate: 2 SP, 0.5 day

Story total: 9 SP, 2.5 days

#### Story P1-E2-S2: Implement room join and leave orchestration

- Task P1-E2-S2-T1: Implement room.join and room.leave handling
  - Estimate: 5 SP, 1.5 days
- Task P1-E2-S2-T2: Add membership validation using existing models
  - Estimate: 3 SP, 1 day
- Task P1-E2-S2-T3: Emit room.snapshot for successful joins
  - Estimate: 3 SP, 1 day

Story total: 11 SP, 3.5 days

#### Story P1-E2-S3: Implement event dispatcher and base telemetry

- Task P1-E2-S3-T1: Implement schema-aware event dispatch pipeline
  - Estimate: 5 SP, 1.5 days
- Task P1-E2-S3-T2: Add structured logs with requestId correlation
  - Estimate: 2 SP, 0.5 day
- Task P1-E2-S3-T3: Add counters and latency metrics for inbound events
  - Estimate: 3 SP, 1 day

Story total: 10 SP, 3 days

### Epic P1-E3: Foundation Verification

#### Story P1-E3-S1: Backend-only realtime verification harness

- Task P1-E3-S1-T1: Create two-client test scenario script
  - Estimate: 3 SP, 1 day
- Task P1-E3-S1-T2: Create integration test for auth plus join plus broadcast
  - Estimate: 5 SP, 1.5 days
- Task P1-E3-S1-T3: Add CI gate command for foundation checks
  - Estimate: 2 SP, 0.5 day

Story total: 10 SP, 3 days

Phase 1 total: 57 SP, 17 person-days

## 4. Phase 2 - Community and Chat MVP

### Epic P2-E1: Community Domain APIs

#### Story P2-E1-S1: Community lifecycle endpoints

- Task P2-E1-S1-T1: Implement create and update community endpoints
  - Estimate: 5 SP, 1.5 days
- Task P2-E1-S1-T2: Implement list and detail endpoints
  - Estimate: 3 SP, 1 day
- Task P2-E1-S1-T3: Add DTO validation and response mapping
  - Estimate: 3 SP, 1 day

Story total: 11 SP, 3.5 days

#### Story P2-E1-S2: Membership and invite code flows

- Task P2-E1-S2-T1: Implement join and leave community flows
  - Estimate: 5 SP, 1.5 days
- Task P2-E1-S2-T2: Implement invite code create and verify flow
  - Estimate: 5 SP, 1.5 days
- Task P2-E1-S2-T3: Add community role-based permission checks
  - Estimate: 3 SP, 1 day

Story total: 13 SP, 4 days

### Epic P2-E2: Channel Domain APIs

#### Story P2-E2-S1: Channel management in communities

- Task P2-E2-S1-T1: Implement create channel endpoint
  - Estimate: 3 SP, 1 day
- Task P2-E2-S1-T2: Implement list channels by community
  - Estimate: 2 SP, 0.5 day
- Task P2-E2-S1-T3: Implement private channel support for MVP DM path and 1-to-1 rules
  - Estimate: 5 SP, 1.5 days

Story total: 10 SP, 3 days

### Epic P2-E3: Message API and Realtime Chat Events

#### Story P2-E3-S1: Message persistence and history

- Task P2-E3-S1-T1: Implement send message endpoint
  - Estimate: 5 SP, 1.5 days
- Task P2-E3-S1-T2: Implement paginated message history endpoint (NoSQL-backed, cursor semantics)
  - Estimate: 6 SP, 2 days
- Task P2-E3-S1-T3: Implement reply support and validation
  - Estimate: 3 SP, 1 day
- Task P2-E3-S1-T4: Design NoSQL message document schema and indexes
  - Estimate: 5 SP, 1.5 days
- Task P2-E3-S1-T5: Implement repository abstraction to coordinate NoSQL writes and relational sidecar updates
  - Estimate: 5 SP, 1.5 days
- Task P2-E3-S1-T6: Implement reconciliation job for sidecar/counter repair and lastMessageId sync
  - Estimate: 3 SP, 1 day

Story total: 27 SP, 8 days

#### Story P2-E3-S2: Realtime chat interaction events

- Task P2-E3-S2-T1: Implement message.created event broadcast
  - Estimate: 3 SP, 1 day
- Task P2-E3-S2-T2: Implement typing.started and typing.stopped events
  - Estimate: 2 SP, 0.5 day
- Task P2-E3-S2-T3: Implement presence join and leave events
  - Estimate: 3 SP, 1 day
- Task P2-E3-S2-T4: Implement read.cursor.updated event and persistence update
  - Estimate: 5 SP, 1.5 days

Story total: 13 SP, 4 days

### Epic P2-E4: Phase 2 Integration and QA Readiness

#### Story P2-E4-S1: Test and contract completion

- Task P2-E4-S1-T1: Add unit tests for role and participant checks
  - Estimate: 3 SP, 1 day
- Task P2-E4-S1-T2: Add integration tests for community-channel-message flows
  - Estimate: 8 SP, 2.5 days
- Task P2-E4-S1-T3: Publish FE integration notes for chat lifecycle
  - Estimate: 2 SP, 0.5 day

Story total: 13 SP, 4 days

Phase 2 total: 60 SP, 18.5 person-days

## 5. Phase 3 - Watch Party MVP

### Epic P3-E1: Watch Room Core APIs

#### Story P3-E1-S1: Watch room setup and configuration

- Task P3-E1-S1-T1: Implement create and configure watch room APIs
  - Estimate: 5 SP, 1.5 days
- Task P3-E1-S1-T2: Implement attach media and source flow
  - Estimate: 3 SP, 1 day
- Task P3-E1-S1-T3: Implement host assign and transfer flow
  - Estimate: 5 SP, 1.5 days

Story total: 13 SP, 4 days

#### Story P3-E1-S2: Snapshot and state bootstrap

- Task P3-E1-S2-T1: Implement watch snapshot endpoint with participants and late-join sync
  - Estimate: 3 SP, 1 day
- Task P3-E1-S2-T2: Integrate snapshot emission for late joiners
  - Estimate: 3 SP, 1 day

Story total: 6 SP, 2 days

### Epic P3-E2: Playback Synchronization and Authority

#### Story P3-E2-S1: Playback state mutation pipeline

- Task P3-E2-S1-T1: Implement play, pause, seek event handlers with serialized room ordering
  - Estimate: 8 SP, 2.5 days
- Task P3-E2-S1-T2: Implement state.changed broadcast flow after commit
  - Estimate: 5 SP, 1.5 days
- Task P3-E2-S1-T3: Persist state updates in watch room config and maintain lastSyncedAt
  - Estimate: 5 SP, 1.5 days

Story total: 18 SP, 5.5 days

#### Story P3-E2-S2: Queue and conflict control

- Task P3-E2-S2-T1: Implement queue.update event and persistence
  - Estimate: 5 SP, 1.5 days
- Task P3-E2-S2-T2: Implement host/moderator authority guard
  - Estimate: 5 SP, 1.5 days
- Task P3-E2-S2-T3: Implement serialized mutation strategy
  - Estimate: 8 SP, 2.5 days

Story total: 18 SP, 5.5 days

### Epic P3-E3: Watch Party Validation

#### Story P3-E3-S1: Multi-client consistency testing

- Task P3-E3-S1-T1: Add integration scenarios for concurrent playback actions
  - Estimate: 8 SP, 2.5 days
- Task P3-E3-S1-T2: Add late join catch-up and snapshot tests
  - Estimate: 5 SP, 1.5 days
- Task P3-E3-S1-T3: Add unauthorized playback control tests
  - Estimate: 3 SP, 1 day

Story total: 16 SP, 5 days

Phase 3 total: 71 SP, 22 person-days

## 6. Phase 4 - Hardening and Production Readiness

### Epic P4-E1: Reliability and Resilience

#### Story P4-E1-S1: Reconnect and idempotency hardening

- Task P4-E1-S1-T1: Implement reconnect and room rejoin behavior
  - Estimate: 5 SP, 1.5 days
- Task P4-E1-S1-T2: Implement idempotency strategy for critical events
  - Estimate: 8 SP, 2.5 days
- Task P4-E1-S1-T3: Implement dead connection cleanup and reconciliation
  - Estimate: 5 SP, 1.5 days

Story total: 18 SP, 5.5 days

### Epic P4-E2: Performance and Security Validation

#### Story P4-E2-S1: Performance validation suite

- Task P4-E2-S1-T1: Build chat burst load scenario
  - Estimate: 5 SP, 1.5 days
- Task P4-E2-S1-T2: Build playback control load scenario
  - Estimate: 5 SP, 1.5 days
- Task P4-E2-S1-T3: Baseline latency and error profiling report
  - Estimate: 3 SP, 1 day

Story total: 13 SP, 4 days

#### Story P4-E2-S2: Security and abuse testing

- Task P4-E2-S2-T1: Permission bypass negative test suite
  - Estimate: 5 SP, 1.5 days
- Task P4-E2-S2-T2: Malformed payload rejection suite
  - Estimate: 3 SP, 1 day
- Task P4-E2-S2-T3: Event-level rate limit validation suite
  - Estimate: 3 SP, 1 day

Story total: 11 SP, 3.5 days

### Epic P4-E3: Operations and Go-live

#### Story P4-E3-S1: Operational readiness artifacts

- Task P4-E3-S1-T1: Define realtime SLOs and alert thresholds
  - Estimate: 3 SP, 1 day
- Task P4-E3-S1-T2: Create dashboard and alert wiring docs
  - Estimate: 2 SP, 0.5 day
- Task P4-E3-S1-T3: Create incident runbook
  - Estimate: 3 SP, 1 day

Story total: 8 SP, 2.5 days

Phase 4 total: 50 SP, 15.5 person-days

## 7. Consolidated Backlog Summary

- Phase 0: 32 SP, 9.5 days
- Phase 1: 57 SP, 17 days
- Phase 2: 60 SP, 18.5 days
- Phase 3: 71 SP, 22 days
- Phase 4: 50 SP, 15.5 days

Grand total: 270 SP, 82.5 person-days

## 8. Suggested Sprint Packaging

- Sprint A: Phase 0 plus P1-E1
- Sprint B: Remaining Phase 1
- Sprint C: P2-E1 plus P2-E2
- Sprint D: P2-E3 plus P2-E4
- Sprint E: P3-E1 plus P3-E2
- Sprint F: P3-E3 plus Phase 4

## 9. Ticket Import Template

Use this schema when importing tickets into Jira, Azure Boards, or Trello:

- Ticket ID
- Parent ID
- Level (Epic or Story or Task)
- Title
- Description
- Estimate SP
- Estimate Person-Days
- Dependency IDs
- Owner
- Status
