export interface SocketAuthContext {
  userId: string;
  token: string;
  issuedAt: number;
  expiresAt: number;
}

export interface SocketHandshakeAuth {
  authorization?: string;
  token?: string;
}
export interface SocketAuthResponse {
  authenticated: boolean;
  userId?: string;
  sessionId?: string;
  error?: string;
}

export interface AuthenticationConfig {
  tokenTimeoutSeconds: number;
  jwtSecret: string;
  jwtAlgorithm: string;
}
