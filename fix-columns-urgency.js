require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        console.log('Adding urgency_type column...');
        await pool.query(`
            ALTER TABLE cq_surgeries 
            ADD COLUMN IF NOT EXISTS urgency_type varchar(50) NOT NULL DEFAULT 'ELECTIVO';
        `);
        console.log('Successfully added urgency_type column.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        pool.end();
    }
}

main();
