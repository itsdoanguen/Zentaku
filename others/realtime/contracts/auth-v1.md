# Realtime Authentication Contract v1

## 1. Purpose

Define how socket authentication works and how it aligns with REST auth.

## 2. Token Transport

Client sends access token during handshake:

1. Preferred: Authorization header with Bearer token.
2. Allowed fallback: auth payload field token.

## 3. Server Authentication Sequence

1. Extract token.
2. Verify signature and expiry using same secret and algorithm policy as REST auth.
3. Build socket user context with userId and role hints.
4. On success, emit connection.ready.
5. On failure, emit nack with auth error code and close connection.
6. The server sends the nack before closing the socket.
7. Use close code 1008 for policy violations and auth failures.
8. If the client does not present a token within 5 seconds, treat it as AUTH_REQUIRED.

## 4. Expired Token Behavior

1. If token expires before connect: reject with AUTH_EXPIRED.
2. If token expires during session: close connection and require reconnect with new token.
3. Auth failure is terminal for the current socket session; the client must re-authenticate through REST before reconnecting.

## 5. Security Rules

1. Never trust client-provided userId in event data.
2. Always derive actor from authenticated socket context.
3. Re-check room permissions per event.
