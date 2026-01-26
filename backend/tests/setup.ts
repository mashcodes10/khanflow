import 'reflect-metadata';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { resetDatabase, closeDatabase, getTestDataSource } from './helpers/db';
import { AppDataSource } from '../src/config/database.config';

// Global setup: initialize database connection
beforeAll(async () => {
  // Ensure DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required for tests');
  }

  // Initialize test database connection
  await getTestDataSource();
});

// Clean up database before each test
beforeEach(async () => {
  await resetDatabase();
});

// Global teardown: close database connection
afterAll(async () => {
  await closeDatabase();
  // Also close AppDataSource if it was initialized
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});
