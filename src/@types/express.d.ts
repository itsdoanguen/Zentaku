// Global type declarations for the application

import type Container from '../config/container';

declare module 'express' {
  interface Request {
    user?: {
      id: number;
      email: string;
      role?: string;
    };
    container?: typeof Container;
  }
}

export {};
