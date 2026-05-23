# Phase 3 Technical Plan: Watch Party MVP

## EX. ABOUT THE COMMENT ON THE CODE

MUST REMEMBER TO NOT EXPLAIN EVERYTHING BY COMMENT, ONLY EXPLAIN FOR COMPLEX THINGS
LET THE CODE EXPLAIN IT SELF, THE NAME AND OTHERS.

## 1. Objective

Deliver synchronized watch-party behavior by reusing room, membership, and chat primitives from previous phases.

## 3.1 Playback Synchronization Rules

1. playback.sync is telemetry only and does not mutate authoritative playback state.
2. The server does not broadcast playback.state.changed in response to playback.sync.
3. Clients use playback.sync drift data to decide when to request watch.snapshot again.
4. Host is the single writer for playback state.
5. Server serializes playback commands per room in arrival order.
6. Non-host playback mutations are rejected before queueing.

## 2. Technical Scope

In scope:

1. Watch-room lifecycle APIs
2. Playback control events and synchronization
3. Host and moderator control rules
4. Snapshot and late-join sync behavior
5. State persistence through WatchRoomConfig

Out of scope:

1. Advanced adaptive synchronization algorithms
2. Multi-host conflict arbitration beyond server serialization
3. Advanced queue recommendation logic

## 3. Data Model Usage

## 7.1 RESTful API Contract Source

Phase 3 REST contract is centralized in:

1. contracts/rest-api-v1.md section 7 for Watch-Room API.
2. contracts/rest-api-v1.md section 8 for error mapping.
3. contracts/rest-api-v1.md section 9 for FE-ready examples.
4. hostId: string
5. updatedAt: ISO-8601

### Update Playback State

Request body:

1. action: enum play | pause | seek, required
2. timestamp: number, required for seek, optional for play and pause

Response body:

1. channelId: string
2. hostId: string
3. isPlaying: boolean
4. currentTimestamp: number
5. lastSyncedAt: ISO-8601

### Update Queue

Request body:

1. playlistQueue: array, required

Response body:

1. channelId: string
2. playlistQueue: array
3. updatedAt: ISO-8601

## 7.3 Pagination, Filter, and Sort Contract

### GET /api/watch-rooms

Query params:

1. page: number, optional, default 1
2. perPage: number, optional, default 20, max 100
3. q: string, optional, media or room name keyword
4. isPlaying: boolean, optional
5. hostId: string, optional
6. sortBy: enum lastSyncedAt | createdAt | participantsCount, optional, default lastSyncedAt
7. sortOrder: enum asc | desc, optional, default desc

Response shape:

1. items: array
2. page: number
3. perPage: number
4. total: number
5. totalPages: number
6. hasNextPage: boolean
7. hasPreviousPage: boolean

## 7.4 Error Response Mapping (REST and Realtime Parity)

Use the same logical error family from contracts/error-codes-v1.md.

1. AUTH_REQUIRED, AUTH_INVALID, AUTH_EXPIRED -> REST 401
2. PERMISSION_DENIED, ROOM_ACCESS_DENIED, HOST_REQUIRED -> REST 403
3. ROOM_NOT_FOUND, SNAPSHOT_UNAVAILABLE -> REST 503
4. PAYLOAD_INVALID, REQUEST_ID_INVALID -> REST 400
5. RATE_LIMITED -> REST 429
6. STATE_CONFLICT -> REST 409
7. INTERNAL_ERROR, DEPENDENCY_UNAVAILABLE -> REST 500

Standard REST error body:

1. code: string
2. message: string
3. requestId: string
4. details: object optional

## 7.5 FE-Ready Payload Examples

### Example: Create Watch Room

Request:

1. channelId: 223
2. mediaId: 4871
3. currentSourceUrl: https://cdn.example.com/stream/ep3.m3u8

Response:

1. channelId: 223
2. hostId: 12
3. isPlaying: false
4. currentTimestamp: 0
5. lastSyncedAt: 2026-04-11T08:45:00.000Z

### Example: Seek via REST Fallback

Request:

1. action: seek
2. timestamp: 1520.4

Response:

1. channelId: 223
2. isPlaying: true
3. currentTimestamp: 1520.4
4. lastSyncedAt: 2026-04-11T08:45:00.000Z

## 8. Test Strategy

Unit tests:

1. Host and moderator authority checks.
2. State transition guard conditions.
3. Queue mutation validation.

Integration tests:

1. Multi-client playback synchronization.
2. Concurrent seek and pause conflict scenarios.
3. Late join snapshot and catch-up.
4. Unauthorized playback control rejection.
5. playback.sync does not mutate state and only updates telemetry.

Performance checks:

1. Burst playback events in single room.
2. Parallel room synchronization stability.

## 9. Risks and Mitigation

Risk 1: Race conditions in rapid playback changes.
Mitigation: Serialize room state updates and enforce single writer per room tick.

Risk 2: Drift between persisted state and broadcast state.
Mitigation: Broadcast only post-commit canonical state payload.

Risk 3: Host transfer edge-case failures.
Mitigation: Atomic host transition service method plus fallback snapshot emission.

## 10. Exit Criteria

1. Multiple clients observe consistent playback state in one room.
2. Host transfer works and permissions are enforced.
3. Late joiners receive snapshot and synchronize correctly.
4. Watch-party snapshots include host, current state, and participant list.
5. Watch-party chat continues to function with existing message flow.
