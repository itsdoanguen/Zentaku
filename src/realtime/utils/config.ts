import type { AuthenticationConfig } from '../types/auth-contract';

export interface RealtimeConfig {
  auth: AuthenticationConfig;
  socket: {
    maxConnectionsPerUser: number;
    reconnectStrategy: {
      maxAttempts: number;
      initialDelayMs: number;
      maxDelayMs: number;
      jitterFactor: number;
    };
  };
  rateLimiting: {
    eventsPerSecond: number;
    burstSize: number;
  };
  backpressure: {
    maxPendingEvents: number;
    dropPolicy: 'drop-oldest' | 'drop-new';
  };
  rooms: {
    maxParticipants: number;
    inactivityTimeoutMs: number;
  };
  messages: {
    maxContentLength: number;
    maxHistoryLimit: number;
  };
  features: {
    typingIndicators: boolean;
    readCursors: boolean;
    watchPartySupport: boolean;
    voiceSupport: boolean;
  };
}

export const DEFAULT_REALTIME_CONFIG: RealtimeConfig = {
  auth: {
    tokenTimeoutSeconds: 5,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-here',
    jwtAlgorithm: 'HS256',
  },
  socket: {
    maxConnectionsPerUser: 1,
    reconnectStrategy: {
      maxAttempts: 5,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      jitterFactor: 0.1,
    },
  },
  rateLimiting: {
    eventsPerSecond: 10,
    burstSize: 5,
  },
  backpressure: {
    maxPendingEvents: 100,
    dropPolicy: 'drop-oldest',
  },
  rooms: {
    maxParticipants: 1000,
    inactivityTimeoutMs: 5 * 60 * 1000,
  },
  messages: {
    maxContentLength: 4096,
    maxHistoryLimit: 100,
  },
  features: {
    typingIndicators: true,
    readCursors: true,
    watchPartySupport: true,
    voiceSupport: false,
  },
};

export const DEVELOPMENT_REALTIME_CONFIG: RealtimeConfig = {
  ...DEFAULT_REALTIME_CONFIG,
  rateLimiting: {
    eventsPerSecond: 100,
    burstSize: 50,
  },
  backpressure: {
    maxPendingEvents: 1000,
    dropPolicy: 'drop-oldest',
  },
  rooms: {
    maxParticipants: 10000,
    inactivityTimeoutMs: 30 * 60 * 1000,
  },
};

export function getRealtimeConfig(): RealtimeConfig {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? DEVELOPMENT_REALTIME_CONFIG : DEFAULT_REALTIME_CONFIG;
}
