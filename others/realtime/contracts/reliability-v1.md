# Realtime Reliability and Recovery Contract v1

## 1. Purpose

Define reconnect, retry, and state recovery behavior.

## 2. Reconnect Strategy

Client behavior:

1. Exponential backoff with jitter.
2. Reconnect attempts capped by client policy.

Server behavior:

1. Accept reconnect as new socket session.
2. Require re-authentication and room rejoin.

## 3. Recovery Sequence

1. Client reconnects and re-authenticates.
2. Client re-sends room.join.
3. Server emits room.snapshot or watch.snapshot.
4. Client pulls message history if needed using message.history.request.

## 4. Delivery Semantics

1. Base mode is at-least-once for server broadcast.
2. Server preserves FIFO ordering for room-scoped broadcasts by serializing state mutation within a room.
3. Clients must handle potential duplicate events by messageId and requestId.
4. Read cursor updates are idempotent.
5. Typing and read-cursor events may be dropped under backpressure; membership and playback state changes must not be silently reordered.

## 5. In-Flight Request Handling

1. If connection closes before ack, client may retry with same requestId.
2. Server deduplicates requestId per user across all rooms with a 60-second sliding window.
3. Dedup storage uses an in-memory LRU cache per instance and can optionally be backed by Redis for multi-instance deployments.
4. If a duplicate requestId replays a successful request, the server re-emits the same ack and response data when available.
5. If a duplicate requestId replays a failed request, the server re-emits the same nack and error data when available.
6. room.join is idempotent; repeated joins for the same room must not duplicate membership or presence events.

## 6. Failure Modes

1. Snapshot unavailable -> SNAPSHOT_UNAVAILABLE.
2. Dependency outage -> DEPENDENCY_UNAVAILABLE.
3. Backpressure drop -> BACKPRESSURE_DROPPED.
