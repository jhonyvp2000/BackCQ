import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function main() {
  await db.execute(sql`TRUNCATE TABLE cq_patient_pii CASCADE;`);
  console.log('Truncated Data.');
  process.exit(0);
}
main();
