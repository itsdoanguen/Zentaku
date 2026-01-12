import type { NextFunction, Request, Response } from 'express';
import { AnilistAPIError, NotFoundError, ValidationError } from '../shared/utils/error';
import logger from '../shared/utils/logger';

/**
 * 404 handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error('Error Handler:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle known operational errors
  if ('isOperational' in err && err.isOperational) {
    res.status((err as unknown as { statusCode?: number }).statusCode || 500).json({
      success: false,
      error: {
        name: err.name,
        message: err.message,
        ...(err instanceof AnilistAPIError && err.details && { details: err.details }),
      },
    });
    return;
  }

  // Handle specific error types
  if (err instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: {
        name: 'NotFoundError',
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: {
        name: 'ValidationError',
        message: err.message,
      },
    });
    return;
  }

  // Unknown errors (programming errors)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    error: {
      name: 'InternalServerError',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
