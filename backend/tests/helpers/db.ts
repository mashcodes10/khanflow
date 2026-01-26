import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/database.config';
import path from 'path';

let testDataSource: DataSource | null = null;

/**
 * Get or create a test database connection
 */
export async function getTestDataSource(): Promise<DataSource> {
  if (testDataSource && testDataSource.isInitialized) {
    return testDataSource;
  }

  /**
   * Test DB URL resolution strategy:
   * - Prefer TEST_DATABASE_URL so tests can explicitly target a local test DB
   * - Fall back to DATABASE_URL only if it's NOT a Supabase URL
   * - Otherwise, default to a local Postgres test database
   */
  const envDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  let databaseUrl =
    !envDatabaseUrl || envDatabaseUrl.includes('supabase.co')
      ? 'postgresql://md.mashiurrahmankhan@localhost:5432/khanflow_test'
      : envDatabaseUrl;

  testDataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [path.join(__dirname, '../../src/database/entities/*{.ts,.js}')],
    migrations: [path.join(__dirname, '../../src/database/migrations/*{.ts,.js}')],
    synchronize: false,
    logging: false,
    ssl: false, // Tests always run against local Postgres (no SSL)
  });

  if (!testDataSource.isInitialized) {
    await testDataSource.initialize();
  }

  // Run migrations
  await testDataSource.runMigrations();

  return testDataSource;
}

/**
 * Reset database state by truncating all tables in correct order
 */
export async function resetDatabase(): Promise<void> {
  const dataSource = await getTestDataSource();
  const queryRunner = dataSource.createQueryRunner();

  try {
    // Disable foreign key checks temporarily
    await queryRunner.query('SET session_replication_role = replica;');

    // Truncate tables in reverse dependency order
    const tables = [
      'activity_events',
      'calendar_links',
      'provider_task_links',
      'accepted_actions',
      'suggestions',
      'intents',
      'intent_boards',
      'life_areas',
      'integrations',
      'users',
    ];

    for (const table of tables) {
      await queryRunner.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
    }

    // Re-enable foreign key checks
    await queryRunner.query('SET session_replication_role = DEFAULT;');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }
}

/**
 * Execute a query in a transaction that will be rolled back
 * Useful for testing database operations without side effects
 */
export async function inTransaction<T>(
  callback: (queryRunner: any) => Promise<T>
): Promise<T> {
  const dataSource = await getTestDataSource();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const result = await callback(queryRunner);
    await queryRunner.rollbackTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
