import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOnboardingColumn1751100000000 implements MigrationInterface {
  name = "AddOnboardingColumn1751100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "onboarding" JSONB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "onboarding"
    `);
  }
}
