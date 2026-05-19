import { sql } from 'drizzle-orm';
import { db } from './src/db/index.js';

async function run() {
    try {
        const result = await db.execute(sql`SELECT DISTINCT surgery_type FROM cq_surgeries`);
        console.log("Distinct surgery types in DB:");
        console.log(result);
    } catch (e: any) {
        console.error(e);
    }
    process.exit(0);
}
run();
