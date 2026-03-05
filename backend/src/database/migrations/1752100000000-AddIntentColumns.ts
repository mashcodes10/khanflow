import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIntentColumns1752100000000 implements MigrationInterface {
    name = "AddIntentColumns1752100000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "intents" 
      ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "priority" varchar(10),
      ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "weeklyFocusAt" TIMESTAMP
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "intents" 
      DROP COLUMN IF EXISTS "completedAt",
      DROP COLUMN IF EXISTS "priority",
      DROP COLUMN IF EXISTS "dueDate",
      DROP COLUMN IF EXISTS "weeklyFocusAt"
    `);
    }
}
