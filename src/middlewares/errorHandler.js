const logger = require('../utils/logger');
const { AnilistAPIError, NotFoundError, ValidationError } = require('../utils/error');

/**
 * 404 handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error Handler:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle known operational errors
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: {
        name: err.name,
        message: err.message,
        ...(err instanceof AnilistAPIError && err.errors && { details: err.errors }),
      },
    });
  }

  // Handle specific error types
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: {
        name: 'NotFoundError',
        message: err.message,
      },
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        name: 'ValidationError',
        message: err.message,
      },
    });
  }

  // Unknown errors (programming errors)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    error: {
      name: 'InternalServerError',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = { notFound, errorHandler };