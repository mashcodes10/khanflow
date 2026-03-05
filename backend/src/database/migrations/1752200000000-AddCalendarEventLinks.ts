import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCalendarEventLinks1752200000000 implements MigrationInterface {
  name = "AddCalendarEventLinks1752200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add calendar event tag columns to intents
    await queryRunner.query(`
      ALTER TABLE "intents"
      ADD COLUMN IF NOT EXISTS "calendarEventId" varchar,
      ADD COLUMN IF NOT EXISTS "calendarProvider" varchar
    `);

    // Create calendar_event_board_links table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "calendar_event_board_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "boardId" uuid NOT NULL,
        "provider" varchar NOT NULL,
        "eventId" varchar NOT NULL,
        "recurringEventId" varchar,
        "eventTitle" varchar NOT NULL,
        "isRecurring" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_calendar_event_board_links" PRIMARY KEY ("id"),
        CONSTRAINT "FK_calendar_event_board_links_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_calendar_event_board_links_board" FOREIGN KEY ("boardId")
          REFERENCES "intent_boards"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_calendar_event_board_links"
      ON "calendar_event_board_links" ("userId", "boardId", "eventId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_calendar_event_board_links"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "calendar_event_board_links"`);
    await queryRunner.query(`
      ALTER TABLE "intents"
      DROP COLUMN IF EXISTS "calendarEventId",
      DROP COLUMN IF EXISTS "calendarProvider"
    `);
  }
}
