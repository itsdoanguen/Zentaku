/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PORT?: string;
    readonly DATABASE_URL: string;
    readonly JWT_SECRET: string;
    readonly JWT_EXPIRES_IN?: string;
    readonly CORS_ORIGIN?: string;
    readonly LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';
    readonly ANILIST_API_URL?: string;
    readonly CACHE_TTL?: string;
  }
}
