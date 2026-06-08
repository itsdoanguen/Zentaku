import dotenv from 'dotenv';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import mongoose from 'mongoose';
import * as entities from '../entities';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  // All TypeORM entities
  entities: [
    entities.User,
    entities.UserAuthentication,
    entities.UserRelationship,
    entities.RefreshToken,
    entities.Role,
    entities.Permission,
    entities.MediaItem,
    entities.AnimeItem,
    entities.ReadingMediaItem,
    entities.NovelItem,
    entities.LibraryEntry,
    entities.ProgressLog,
    entities.CustomList,
    entities.ListItem,
    entities.ListInvitation,
    entities.Community,
    entities.CommunityMember,
    entities.Channel,
    entities.ChannelParticipant,
    entities.Message,
    entities.WatchRoomConfig,
    entities.Activity,
    entities.Comment,
    entities.Notification,
    entities.SupportTicket,
  ],

  migrations: ['src/migrations/**/*.ts'],

  subscribers: ['src/subscribers/**/*.ts'],

  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn', 'info'] : ['error'],

  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  },

  timezone: 'Z',
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      // eslint-disable-next-line no-console
      console.log('✓ TypeORM DataSource initialized');
    }

    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      // eslint-disable-next-line no-console
      console.log('✓ MongoDB connection initialized');
    } else {
      console.warn('⚠ MONGODB_URI is not set, MongoDB connection skipped');
    }
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      // eslint-disable-next-line no-console
      console.log('✓ TypeORM DataSource closed');
    }
    await mongoose.disconnect();
    // eslint-disable-next-line no-console
    console.log('✓ MongoDB connection closed');
  } catch (error) {
    console.error('✗ Database close failed:', error);
    throw error;
  }
};

process.on('beforeExit', async () => {
  await closeDatabase();
});

export default AppDataSource;
