import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskAppTypes1751300000000 implements MigrationInterface {
  name = "AddTaskAppTypes1751300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add GOOGLE_TASKS to integrations_app_type_enum
    await queryRunner.query(`
      ALTER TYPE "public"."integrations_app_type_enum" 
      ADD VALUE IF NOT EXISTS 'GOOGLE_TASKS'
    `);

    // Add MICROSOFT_TODO to integrations_app_type_enum
    await queryRunner.query(`
      ALTER TYPE "public"."integrations_app_type_enum" 
      ADD VALUE IF NOT EXISTS 'MICROSOFT_TODO'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values easily; no-op.
  }
}
