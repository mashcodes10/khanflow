import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBoardExternalLinks1752000000000 implements MigrationInterface {
  name = "AddBoardExternalLinks1752000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create board_external_links table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "board_external_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "boardId" uuid NOT NULL,
        "provider" "public"."provider_task_links_provider_enum" NOT NULL,
        "externalListId" varchar NOT NULL,
        "externalListName" varchar NOT NULL,
        "syncDirection" varchar NOT NULL DEFAULT 'both',
        "lastSyncedAt" timestamp,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_external_links" PRIMARY KEY ("id"),
        CONSTRAINT "FK_board_external_links_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_board_external_links_board" FOREIGN KEY ("boardId")
          REFERENCES "intent_boards"("id") ON DELETE CASCADE
      )
    `);

    // Create intent_external_links table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "intent_external_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "intentId" uuid NOT NULL,
        "boardLinkId" uuid,
        "provider" "public"."provider_task_links_provider_enum" NOT NULL,
        "externalTaskId" varchar NOT NULL,
        "externalListId" varchar NOT NULL,
        "lastSyncedAt" timestamp,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_intent_external_links" PRIMARY KEY ("id"),
        CONSTRAINT "FK_intent_external_links_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_intent_external_links_intent" FOREIGN KEY ("intentId")
          REFERENCES "intents"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_intent_external_links_board_link" FOREIGN KEY ("boardLinkId")
          REFERENCES "board_external_links"("id") ON DELETE SET NULL
      )
    `);

    // Unique index to prevent duplicate links
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_intent_external_links_dedup"
      ON "intent_external_links" ("userId", "provider", "externalTaskId", "externalListId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_intent_external_links_dedup"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "intent_external_links"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "board_external_links"`);
  }
}
