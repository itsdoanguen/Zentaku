# Realtime Observability Contract v1

## 1. Purpose

Define required logs and metrics for realtime operations.

## 2. Required Log Fields

Every realtime log record should include:

1. timestamp
2. level
3. requestId
4. event
5. userId optional for unauthenticated events
6. channelId optional
7. status
8. errorCode optional
9. latencyMs optional

## 3. Minimum Metrics

1. active_connections
2. auth_failures_total
3. room_join_attempts_total
4. room_join_denied_total
5. event_dispatch_latency_ms
6. event_errors_total
7. rate_limited_total

## 4. Alert Recommendations

1. auth failure spike over baseline.
2. room join denied anomaly.
3. dispatch latency p95 breach.
4. event error rate breach.

## 5. Correlation Rules

1. requestId from inbound event must be propagated through service logs.
2. Ack and nack logs must include source requestId.
