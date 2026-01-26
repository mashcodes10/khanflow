import 'reflect-metadata';
import { DataSource } from 'typeorm';

// Explicitly import entities so TypeORM doesn't need to require TS files by path
import { User } from '../../src/database/entities/user.entity';
import { Integration } from '../../src/database/entities/integration.entity';
import { Event } from '../../src/database/entities/event.entity';
import { Availability } from '../../src/database/entities/availability.entity';
import { DayAvailability } from '../../src/database/entities/day-availability';
import { Meeting } from '../../src/database/entities/meeting.entity';
import { Intent } from '../../src/database/entities/intent.entity';
import { IntentBoard } from '../../src/database/entities/intent-board.entity';
import { LifeArea } from '../../src/database/entities/life-area.entity';
import { Suggestion } from '../../src/database/entities/suggestion.entity';
import { AcceptedAction } from '../../src/database/entities/accepted-action.entity';
import { ProviderTaskLink } from '../../src/database/entities/provider-task-link.entity';
import { CalendarLink } from '../../src/database/entities/calendar-link.entity';
import { ActivityEvent } from '../../src/database/entities/activity-event.entity';

// Explicitly import migrations to avoid dynamic TS requires in tests
import { CreateTables1741780270097 } from '../../src/database/migrations/1741780270097-CreateTables';
import { CreateTables1741879724900 } from '../../src/database/migrations/1741879724900-CreateTables';
import { UpdateEventTable1742035317807 } from '../../src/database/migrations/1742035317807-UpdateEvent_Table';
import { UpdateMeetingTable1742039170939 } from '../../src/database/migrations/1742039170939-UpdateMeeting_Table';
import { AddMicrosoftProviderAndDuration1749862491582 } from '../../src/database/migrations/1749862491582-AddMicrosoftProviderAndDuration';
import { AddMicrosoftEnums1750000000000 } from '../../src/database/migrations/1750000000000-AddMicrosoftEnums';
import { CreateLifeOrgTables1750500000000 } from '../../src/database/migrations/1750500000000-CreateLifeOrgTables';
import { AddSuggestionSystemTables1751000000000 } from '../../src/database/migrations/1751000000000-AddSuggestionSystemTables';
import { AddOnboardingColumn1751100000000 } from '../../src/database/migrations/1751100000000-AddOnboardingColumn';
import { AddTasksCategoryEnum1751200000000 } from '../../src/database/migrations/1751200000000-AddTasksCategoryEnum';
import { AddTaskAppTypes1751300000000 } from '../../src/database/migrations/1751300000000-AddTaskAppTypes';
import { FixMeetingTimeColumns1751400000000 } from '../../src/database/migrations/1751400000000-FixMeetingTimeColumns';
import { AddAvailabilitySettings1751500000000 } from '../../src/database/migrations/1751500000000-AddAvailabilitySettings';

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
    entities: [
      User,
      Integration,
      Event,
      Availability,
      DayAvailability,
      Meeting,
      Intent,
      IntentBoard,
      LifeArea,
      Suggestion,
      AcceptedAction,
      ProviderTaskLink,
      CalendarLink,
      ActivityEvent,
    ],
    migrations: [
      CreateTables1741780270097,
      CreateTables1741879724900,
      UpdateEventTable1742035317807,
      UpdateMeetingTable1742039170939,
      AddMicrosoftProviderAndDuration1749862491582,
      AddMicrosoftEnums1750000000000,
      CreateLifeOrgTables1750500000000,
      AddSuggestionSystemTables1751000000000,
      AddOnboardingColumn1751100000000,
      AddTasksCategoryEnum1751200000000,
      AddTaskAppTypes1751300000000,
      FixMeetingTimeColumns1751400000000,
      AddAvailabilitySettings1751500000000,
    ],
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
 * Reset database state by deleting all rows in correct order
 * Uses DELETE instead of TRUNCATE to avoid deadlocks in parallel test execution
 */
export async function resetDatabase(): Promise<void> {
  const dataSource = await getTestDataSource();
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Delete tables in reverse dependency order (children first)
    // Note: users has FK (availabilityId) to availability, so we must delete users first
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
      'meetings',
      'events',
      'day_availability',
      'users', // Delete users before availability (users.availabilityId FK references availability.id)
      'availability',
    ];

    // First, break FK relationships by setting FK columns to NULL
    // This prevents FK constraint violations during deletion
    await queryRunner.query(`UPDATE "users" SET "availabilityId" = NULL WHERE "availabilityId" IS NOT NULL;`);

    // Now delete in order
    for (const table of tables) {
      await queryRunner.query(`DELETE FROM "${table}";`);
    }

    // Reset sequences
    await queryRunner.query(`SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false);`);
    await queryRunner.query(`SELECT setval(pg_get_serial_sequence('availability', 'id'), 1, false);`);
    
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
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
