import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuggestionSystemTables1751000000000 implements MigrationInterface {
  name = 'AddSuggestionSystemTables1751000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add lastActivityAt to intents table
    await queryRunner.query(`
      ALTER TABLE "intents" 
      ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP
    `);

    // Add aiPayload and actedAt to suggestions table
    await queryRunner.query(`
      ALTER TABLE "suggestions" 
      ADD COLUMN IF NOT EXISTS "aiPayload" JSONB,
      ADD COLUMN IF NOT EXISTS "actedAt" TIMESTAMP
    `);

    // Create accepted_actions table (idempotent)
    await queryRunner.query(`
      CREATE TYPE "accepted_action_type_enum" AS ENUM('task', 'reminder', 'plan')
    `);
    await queryRunner.query(`
      CREATE TYPE "accepted_action_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "accepted_actions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "suggestionId" UUID NOT NULL,
        "intentId" UUID NOT NULL,
        "type" "accepted_action_type_enum" NOT NULL,
        "status" "accepted_action_status_enum" NOT NULL DEFAULT 'pending',
        "optionIndex" INTEGER,
        "metadata" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_accepted_actions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_accepted_actions_suggestion" FOREIGN KEY ("suggestionId") REFERENCES "suggestions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_accepted_actions_intent" FOREIGN KEY ("intentId") REFERENCES "intents"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_accepted_actions_userId" ON "accepted_actions" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_accepted_actions_intentId" ON "accepted_actions" ("intentId")`);

    // Create provider_task_links table (idempotent)
    await queryRunner.query(`
      CREATE TYPE "provider_type_enum" AS ENUM('google', 'microsoft')
    `);
    await queryRunner.query(`
      CREATE TYPE "provider_task_status_enum" AS ENUM('open', 'completed', 'deleted')
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "provider_task_links" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "acceptedActionId" UUID NOT NULL,
        "intentId" UUID NOT NULL,
        "provider" "provider_type_enum" NOT NULL,
        "providerTaskId" VARCHAR NOT NULL,
        "providerListId" VARCHAR NOT NULL,
        "status" "provider_task_status_enum" NOT NULL DEFAULT 'open',
        "optionIndex" INTEGER,
        "providerUpdatedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_provider_task_links_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_provider_task_links_accepted_action" FOREIGN KEY ("acceptedActionId") REFERENCES "accepted_actions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_provider_task_links_intent" FOREIGN KEY ("intentId") REFERENCES "intents"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_provider_task_links_idempotency" UNIQUE ("userId", "acceptedActionId", "optionIndex")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_provider_task_links_userId" ON "provider_task_links" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_provider_task_links_intentId" ON "provider_task_links" ("intentId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_provider_task_links_provider_task" ON "provider_task_links" ("provider", "providerTaskId")`);

    // Create calendar_links table (idempotent)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "calendar_links" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "acceptedActionId" UUID NOT NULL,
        "intentId" UUID NOT NULL,
        "providerEventId" VARCHAR NOT NULL,
        "startAt" TIMESTAMP NOT NULL,
        "endAt" TIMESTAMP NOT NULL,
        "provider" VARCHAR(50),
        "providerUpdatedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_calendar_links_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_calendar_links_accepted_action" FOREIGN KEY ("acceptedActionId") REFERENCES "accepted_actions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_calendar_links_intent" FOREIGN KEY ("intentId") REFERENCES "intents"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_calendar_links_userId" ON "calendar_links" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_calendar_links_intentId" ON "calendar_links" ("intentId")`);

    // Create activity_events table (idempotent)
    await queryRunner.query(`
      CREATE TYPE "activity_event_type_enum" AS ENUM(
        'suggestion_accepted',
        'suggestion_dismissed',
        'suggestion_snoozed',
        'task_created',
        'task_completed',
        'calendar_event_created',
        'intent_updated'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "activity_events" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "intentId" UUID,
        "eventType" "activity_event_type_enum" NOT NULL,
        "metadata" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_activity_events_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_activity_events_intent" FOREIGN KEY ("intentId") REFERENCES "intents"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_activity_events_userId" ON "activity_events" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_activity_events_intentId" ON "activity_events" ("intentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_activity_events_createdAt" ON "activity_events" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_activity_events_user_intent_created" ON "activity_events" ("userId", "intentId", "createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop activity_events table
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_events"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "activity_event_type_enum"`);

    // Drop calendar_links table
    await queryRunner.query(`DROP TABLE IF EXISTS "calendar_links"`);

    // Drop provider_task_links table
    await queryRunner.query(`DROP TABLE IF EXISTS "provider_task_links"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "provider_task_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "provider_type_enum"`);

    // Drop accepted_actions table
    await queryRunner.query(`DROP TABLE IF EXISTS "accepted_actions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "accepted_action_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "accepted_action_type_enum"`);

    // Remove columns from suggestions table
    await queryRunner.query(`
      ALTER TABLE "suggestions" 
      DROP COLUMN IF EXISTS "aiPayload",
      DROP COLUMN IF EXISTS "actedAt"
    `);

    // Remove column from intents table
    await queryRunner.query(`
      ALTER TABLE "intents" 
      DROP COLUMN IF EXISTS "lastActivityAt"
    `);
  }
}
