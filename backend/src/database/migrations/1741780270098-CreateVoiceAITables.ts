import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVoiceAITables1741780270098 implements MigrationInterface {
  name = "CreateVoiceAITables1741780270098";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversations table
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "current_step" varchar(20) NOT NULL DEFAULT 'initial',
        "extracted_data" jsonb,
        "pending_fields" jsonb,
        "context" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "last_activity_at" timestamp,
        "completed_at" timestamp,
        "timeout_at" timestamp,
        CONSTRAINT "FK_conversations_user" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create conversation_messages table
    await queryRunner.query(`
      CREATE TABLE "conversation_messages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL,
        "role" varchar(20) NOT NULL,
        "content" text NOT NULL,
        "parsed_data" jsonb,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_conversation_messages_conversation" FOREIGN KEY ("conversation_id") 
          REFERENCES "conversations"("id") ON DELETE CASCADE
      )
    `);

    // Create task_conflicts table
    await queryRunner.query(`
      CREATE TABLE "task_conflicts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "task_id" varchar(255) NOT NULL,
        "conflicting_event_id" varchar(255) NOT NULL,
        "conflict_type" varchar(50) NOT NULL,
        "severity" varchar(20) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "conflict_details" jsonb,
        "resolution" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "resolved_at" timestamp,
        CONSTRAINT "FK_task_conflicts_user" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create recurring_tasks table
    await queryRunner.query(`
      CREATE TABLE "recurring_tasks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "task_template" jsonb NOT NULL,
        "recurrence_rule" varchar(255) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "instance_ids" jsonb,
        "exception_dates" jsonb,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        "last_occurrence_created_at" timestamp,
        CONSTRAINT "FK_recurring_tasks_user" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_conversations_user_status" ON "conversations" ("user_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_conversations_timeout" ON "conversations" ("timeout_at") 
      WHERE "status" = 'active'
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_conversation_messages_conversation" ON "conversation_messages" ("conversation_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_task_conflicts_user_status" ON "task_conflicts" ("user_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recurring_tasks_user_status" ON "recurring_tasks" ("user_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recurring_tasks_next_occurrence" ON "recurring_tasks" ("start_date", "status") 
      WHERE "status" = 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recurring_tasks_next_occurrence"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recurring_tasks_user_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_conflicts_user_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversation_messages_conversation"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_timeout"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_user_status"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "recurring_tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "task_conflicts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversation_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
  }
}
