/**
 * Realtime Authentication Contract v1
 * Defined in: docs/plan/realtime/contracts/auth-v1.md
 */

export interface SocketAuthContext {
  userId: string;
  token: string;
  issuedAt: number; // Unix timestamp in milliseconds
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * Token transport options for Socket.IO handshake
 */
export interface SocketHandshakeAuth {
  // Preferred: Authorization header with Bearer token
  authorization?: string;
  // Fallback: token field
  token?: string;
}

/**
 * Socket authentication response sent by server
 */
export interface SocketAuthResponse {
  authenticated: boolean;
  userId?: string;
  sessionId?: string;
  error?: string;
}

/**
 * Authentication configuration
 */
export interface AuthenticationConfig {
  // Timeout for client to present token during handshake (seconds)
  tokenTimeoutSeconds: number; // Default: 5

  // JWT verification config (should match REST auth settings)
  jwtSecret: string;
  jwtAlgorithm: string;
}
