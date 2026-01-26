import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMeetingTimeColumns1751400000000 implements MigrationInterface {
    name = 'FixMeetingTimeColumns1751400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix meetings table: Change startTime from TIMESTAMP to TIMESTAMPTZ
        await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "startTime" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "meetings" 
            ALTER COLUMN "startTime" 
            TYPE TIMESTAMP WITH TIME ZONE 
            USING "startTime" AT TIME ZONE 'UTC'
        `);
        await queryRunner.query(`UPDATE "meetings" SET "startTime" = NOW() WHERE "startTime" IS NULL`);
        await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "startTime" SET NOT NULL`);
        
        // Fix meetings table: Change endTime from TIMESTAMP to TIMESTAMPTZ
        await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "endTime" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "meetings" 
            ALTER COLUMN "endTime" 
            TYPE TIMESTAMP WITH TIME ZONE 
            USING "endTime" AT TIME ZONE 'UTC'
        `);
        await queryRunner.query(`UPDATE "meetings" SET "endTime" = NOW() + INTERVAL '1 hour' WHERE "endTime" IS NULL`);
        await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "endTime" SET NOT NULL`);
        
        // Fix day_availability table: Change startTime from TIMESTAMP to TIMESTAMPTZ
        await queryRunner.query(`ALTER TABLE "day_availability" ALTER COLUMN "startTime" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "day_availability" 
            ALTER COLUMN "startTime" 
            TYPE TIMESTAMP WITH TIME ZONE 
            USING "startTime" AT TIME ZONE 'UTC'
        `);
        await queryRunner.query(`UPDATE "day_availability" SET "startTime" = NOW() WHERE "startTime" IS NULL`);
        await queryRunner.query(`ALTER TABLE "day_availability" ALTER COLUMN "startTime" SET NOT NULL`);
        
        // Fix day_availability table: Change endTime from TIMESTAMP to TIMESTAMPTZ
        await queryRunner.query(`ALTER TABLE "day_availability" ALTER COLUMN "endTime" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "day_availability" 
            ALTER COLUMN "endTime" 
            TYPE TIMESTAMP WITH TIME ZONE 
            USING "endTime" AT TIME ZONE 'UTC'
        `);
        await queryRunner.query(`UPDATE "day_availability" SET "endTime" = NOW() + INTERVAL '1 hour' WHERE "endTime" IS NULL`);
        await queryRunner.query(`ALTER TABLE "day_availability" ALTER COLUMN "endTime" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert meetings table to TIMESTAMP (without time zone)
        await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "startTime" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "meetings" 
            ALTER COLUMN "startTime" 
            TYPE TIMESTAMP 
            USING "startTime"
        `);
        await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "startTime" SET NOT NULL`);
        
        await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "endTime" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "meetings" 
            ALTER COLUMN "endTime" 
            TYPE TIMESTAMP 
            USING "endTime"
        `);
        await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "endTime" SET NOT NULL`);
        
        // Revert day_availability table to TIMESTAMP (without time zone)
        await queryRunner.query(`ALTER TABLE "day_availability" ALTER COLUMN "startTime" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "day_availability" 
            ALTER COLUMN "startTime" 
            TYPE TIMESTAMP 
            USING "startTime"
        `);
        await queryRunner.query(`ALTER TABLE "day_availability" ALTER COLUMN "startTime" SET NOT NULL`);
        
        await queryRunner.query(`ALTER TABLE "day_availability" ALTER COLUMN "endTime" DROP NOT NULL`);
        await queryRunner.query(`
            ALTER TABLE "day_availability" 
            ALTER COLUMN "endTime" 
            TYPE TIMESTAMP 
            USING "endTime"
        `);
        await queryRunner.query(`ALTER TABLE "day_availability" ALTER COLUMN "endTime" SET NOT NULL`);
    }
}
