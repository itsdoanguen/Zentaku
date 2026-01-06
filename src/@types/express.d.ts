// Global type declarations for the application

declare module 'express' {
  interface Request {
    user?: {
      id: number;
      email: string;
      role?: string;
    };
  }
}

export {};
