import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTasksCategoryEnum1751200000000 implements MigrationInterface {
  name = "AddTasksCategoryEnum1751200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."integrations_category_enum" 
      ADD VALUE IF NOT EXISTS 'TASKS'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values easily; no-op.
  }
}
