import dotenv from 'dotenv';
import type { Server } from 'http';
import app from './app';
import logger from './shared/utils/logger';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server: Server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Handle server startup errors
server.on('error', (err: Error & { code?: string }) => {
  console.error('Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('\nShutting down server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err.message);
  console.error(err.stack);
  server.close(() => {
    process.exit(1);
  });
});
