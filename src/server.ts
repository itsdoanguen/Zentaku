import dotenv from 'dotenv';
import type { Server } from 'http';
import { container, createApp } from './app';
import logger from './shared/utils/logger';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    await container.initialize();

    const app = createApp();

    const server: Server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    server.on('error', (err: Error & { code?: string }) => {
      console.error('Server error:', err.message);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
    });

    const shutdown = async () => {
      logger.info('\nShutting down server...');
      server.close(async () => {
        logger.info('Server closed');
        await container.shutdown();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

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
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
