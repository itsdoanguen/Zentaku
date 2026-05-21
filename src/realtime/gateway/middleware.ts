import type { Socket } from 'socket.io';
import { TokenUtil } from '../../modules/auth/utils/token.util';
import { isAccessTokenRevoked } from '../../modules/auth/utils/access-token-revocation.util';
import type { AuthenticatedSocketContext } from './gateway.interface';
import { RealtimeErrorCode } from '../types/errors';
import { randomUUID } from 'crypto';

/**
 * Socket.IO Authentication Middleware
 * Runs during the handshake phase to validate access tokens.
 *
 * Requirements (auth-v1.md):
 * 1. Extract token from socket.handshake.auth.token or Authorization header.
 * 2. Support standard Bearer prefix.
 * 3. Verify signature/expiration using standard TokenUtil.
 * 4. Verify revocation status.
 * 5. Tag socket with context on success, or save authError on failure for custom Nack delivery.
 */
export const createAuthMiddleware = () => {
  return (socket: Socket, next: (err?: Error) => void) => {
    try {
      const authPayload = socket.handshake.auth || {};
      let token = authPayload.token || socket.handshake.headers.authorization;

      if (!token) {
        (socket as any).authError = {
          code: RealtimeErrorCode.AUTH_REQUIRED,
          message: 'Authentication token required',
        };
        return next();
      }

      // Extract Bearer token prefix if present
      if (token.startsWith('Bearer ')) {
        token = token.substring(7);
      }

      // Check revocation status
      if (isAccessTokenRevoked(token)) {
        (socket as any).authError = {
          code: RealtimeErrorCode.AUTH_INVALID,
          message: 'Token has been revoked. Please login again.',
        };
        return next();
      }

      try {
        const payload = TokenUtil.verifyAccessToken(token);

        const context: AuthenticatedSocketContext = {
          socketId: socket.id,
          userId: String(payload.userId || (payload as any).id),
          sessionId: randomUUID(),
          authenticatedAt: Date.now(),
          rooms: new Set<string>(),
        };

        socket.data.context = context;
      } catch (err: any) {
        const isExpired = err?.name === 'TokenExpiredError' || err?.message?.includes('expired');
        (socket as any).authError = {
          code: isExpired ? RealtimeErrorCode.AUTH_EXPIRED : RealtimeErrorCode.AUTH_INVALID,
          message: isExpired ? 'Authentication token has expired' : 'Invalid or expired token',
        };
      }

      next();
    } catch (error: any) {
      (socket as any).authError = {
        code: RealtimeErrorCode.INTERNAL_ERROR,
        message: error.message || 'Internal authentication error',
      };
      next();
    }
  };
};
