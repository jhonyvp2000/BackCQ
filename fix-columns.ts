import { config } from 'dotenv';
config({ path: '.env' });
import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log('Adding specific columns using Drizzle...');
        await db.execute(sql`
            ALTER TABLE cq_surgeries 
            ADD COLUMN IF NOT EXISTS actual_start_time timestamp,
            ADD COLUMN IF NOT EXISTS anesthesia_start_time timestamp,
            ADD COLUMN IF NOT EXISTS pre_incision_time timestamp,
            ADD COLUMN IF NOT EXISTS surgery_end_time timestamp,
            ADD COLUMN IF NOT EXISTS patient_exit_time timestamp,
            ADD COLUMN IF NOT EXISTS urpa_exit_time timestamp,
            ADD COLUMN IF NOT EXISTS completed_time timestamp;
        `);
        console.log('Successfully added columns.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

main();
