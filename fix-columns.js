require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        console.log('Adding specific columns...');
        await pool.query(`
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
        pool.end();
    }
}

main();
