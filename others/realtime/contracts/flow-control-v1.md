# Realtime Flow Control v1

## 1. Purpose

Define rate limiting and backpressure behavior for realtime events.

## 2. Default Per-User Rate Limits

1. Limits are per-user global across all rooms and concurrent connections.
2. message.send: 10 events per 10 seconds.
3. typing.started and typing.stopped: 20 events per 10 seconds.
4. read.cursor.update: 15 events per 10 seconds.
5. playback controls and queue.update: 12 events per 10 seconds.
6. Each event family uses an independent sliding 10-second window.

## 3. Message Constraints

1. message.send content max length: 4000.
2. attachments max item count follows API policy.

## 4. Backpressure Policy

1. If inbound queue threshold is exceeded, server may reject with RATE_LIMITED or BACKPRESSURE_DROPPED.
2. Critical control events should be prioritized over typing events.
3. Server must reject over-limit events immediately; no queueing or delayed replay is guaranteed.
4. BACKPRESSURE_DROPPED should be reserved for low-priority transient events such as typing and read cursor updates.

## 5. Client Guidance

1. Debounce typing and read-cursor updates.
2. Retry only on retryable errors.
3. Do not blindly retry RATE_LIMITED without backoff.
