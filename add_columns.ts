import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        await db.execute(sql`ALTER TABLE cq_surgeries ADD COLUMN IF NOT EXISTS insurance_type varchar(50);`);
        console.log('Added insurance_type column');
    } catch (e) {
        console.log('Error adding insurance_type:', e.message);
    }

    try {
        await db.execute(sql`ALTER TABLE cq_surgeries ADD COLUMN IF NOT EXISTS origin varchar(255);`);
        console.log('Added origin column');
    } catch (e) {
        console.log('Error adding origin:', e.message);
    }

    process.exit(0);
}
main();
