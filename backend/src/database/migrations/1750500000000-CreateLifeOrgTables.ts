import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLifeOrgTables1750500000000 implements MigrationInterface {
  name = "CreateLifeOrgTables1750500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // life_areas table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "life_areas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "userId" uuid NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        "icon" character varying(50),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_life_areas_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_life_areas_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_life_areas_userId" ON "life_areas" ("userId")`
    );

    // intent_boards table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "intent_boards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "lifeAreaId" uuid NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_intent_boards_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_intent_boards_life_area" FOREIGN KEY ("lifeAreaId") REFERENCES "life_areas"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_intent_boards_lifeAreaId" ON "intent_boards" ("lifeAreaId")`
    );

    // intents table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "intents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "intentBoardId" uuid NOT NULL,
        "order" integer NOT NULL DEFAULT 0,
        "lastSuggestedAt" TIMESTAMP,
        "lastEngagedAt" TIMESTAMP,
        "lastActivityAt" TIMESTAMP,
        "suggestionCount" integer NOT NULL DEFAULT 0,
        "acceptCount" integer NOT NULL DEFAULT 0,
        "ignoreCount" integer NOT NULL DEFAULT 0,
        "isExample" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_intents_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_intents_intent_board" FOREIGN KEY ("intentBoardId") REFERENCES "intent_boards"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_intents_intentBoardId" ON "intents" ("intentBoardId")`
    );

    // suggestions_status enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'suggestions_status_enum') THEN
          CREATE TYPE "suggestions_status_enum" AS ENUM('pending', 'shown', 'accepted', 'snoozed', 'ignored');
        END IF;
      END$$;
    `);

    // suggestions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "suggestions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "intentId" uuid NOT NULL,
        "naturalLanguagePhrase" text NOT NULL,
        "reason" text NOT NULL,
        "status" "suggestions_status_enum" NOT NULL DEFAULT 'pending',
        "suggestedAction" character varying(50) NOT NULL,
        "suggestedDetails" json,
        "priority" character varying(20) NOT NULL,
        "heuristicType" character varying(50) NOT NULL,
        "aiPayload" json,
        "shownAt" TIMESTAMP,
        "actedAt" TIMESTAMP,
        "snoozedUntil" TIMESTAMP,
        "ignoreCount" integer NOT NULL DEFAULT 0,
        "acceptCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suggestions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_suggestions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_suggestions_intent" FOREIGN KEY ("intentId") REFERENCES "intents"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_suggestions_userId" ON "suggestions" ("userId")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_suggestions_intentId" ON "suggestions" ("intentId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop suggestions first due to FK dependencies
    await queryRunner.query(`DROP TABLE IF EXISTS "suggestions"`);

    // Drop enum type if unused
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'suggestions_status_enum') THEN
          DROP TYPE "suggestions_status_enum";
        END IF;
      END$$;
    `);

    // Drop intents and related tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "intents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "intent_boards"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "life_areas"`);
  }
}

