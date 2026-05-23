# Realtime Error Codes v1

## 1. Purpose

Define stable error codes for realtime ack and nack responses.

## 2. Auth Errors

1. AUTH_REQUIRED
   - Authentication token missing.
2. AUTH_INVALID
   - Token format or signature invalid.
3. AUTH_EXPIRED
   - Token expired.

## 3. Permission Errors

1. PERMISSION_DENIED
   - User lacks role or privilege.
2. ROOM_ACCESS_DENIED
   - User cannot access target room.
3. HOST_REQUIRED
   - Playback control requires host or moderator.

## 4. Validation Errors

1. EVENT_NOT_SUPPORTED
   - Unknown event name.
2. EVENT_VERSION_UNSUPPORTED
   - Version not accepted.
3. PAYLOAD_INVALID
   - Data payload does not match schema.
4. REQUEST_ID_INVALID
   - Missing or malformed requestId.

## 5. Resource Errors

1. ROOM_NOT_FOUND
   - Target room does not exist.
2. MESSAGE_NOT_FOUND
   - Referenced message does not exist.
3. SNAPSHOT_UNAVAILABLE
   - Room snapshot could not be generated.

## 6. Reliability and Flow Control Errors

1. RATE_LIMITED
   - Sender exceeded event rate limit.
2. BACKPRESSURE_DROPPED
   - Event dropped due to server backpressure.
3. STATE_CONFLICT
   - Concurrent state update conflict detected.

## 7. Internal Errors

1. INTERNAL_ERROR
   - Unexpected server error.
2. DEPENDENCY_UNAVAILABLE
   - Required service or datastore unavailable.

## 8. Recommended HTTP Parity Mapping

1. AUTH_REQUIRED, AUTH_INVALID, AUTH_EXPIRED -> HTTP 401.
2. PERMISSION_DENIED, ROOM_ACCESS_DENIED, HOST_REQUIRED -> HTTP 403.
3. ROOM_NOT_FOUND, MESSAGE_NOT_FOUND -> HTTP 404.
4. PAYLOAD_INVALID, REQUEST_ID_INVALID -> HTTP 400.
5. RATE_LIMITED -> HTTP 429.
6. INTERNAL_ERROR, DEPENDENCY_UNAVAILABLE -> HTTP 500.
