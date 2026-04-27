import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log("Connecting to", process.env.DATABASE_URL);
  const sql = postgres(process.env.DATABASE_URL);
  
  try {
    await sql`ALTER TABLE cq_patient_pii ALTER COLUMN dni TYPE varchar(20);`;
    console.log("Success: Changed dni column to varchar(20)");
  } catch (err) {
    console.error("Error altering table", err);
  } finally {
    await sql.end();
  }
}

main();
