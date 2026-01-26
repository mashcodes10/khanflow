import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvailabilitySettings1751500000000 implements MigrationInterface {
    name = 'AddAvailabilitySettings1751500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add timezone column
        await queryRunner.query(`
            ALTER TABLE "availability" 
            ADD COLUMN IF NOT EXISTS "timezone" varchar DEFAULT 'America/New_York'
        `);

        // Add minimumNotice column (in minutes)
        await queryRunner.query(`
            ALTER TABLE "availability" 
            ADD COLUMN IF NOT EXISTS "minimumNotice" integer DEFAULT 240
        `);

        // Add bookingWindow column (in days)
        await queryRunner.query(`
            ALTER TABLE "availability" 
            ADD COLUMN IF NOT EXISTS "bookingWindow" integer DEFAULT 60
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "availability" DROP COLUMN IF EXISTS "bookingWindow"`);
        await queryRunner.query(`ALTER TABLE "availability" DROP COLUMN IF EXISTS "minimumNotice"`);
        await queryRunner.query(`ALTER TABLE "availability" DROP COLUMN IF EXISTS "timezone"`);
    }
}
