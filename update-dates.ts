import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found in environment");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log("Updating all dates in cq_surgeries by +24 hours...");

  try {
    await db.execute(sql`
      UPDATE cq_surgeries
      SET 
        scheduled_date = scheduled_date + interval '24 hours',
        actual_start_time = actual_start_time + interval '24 hours',
        anesthesia_start_time = anesthesia_start_time + interval '24 hours',
        pre_incision_time = pre_incision_time + interval '24 hours',
        surgery_end_time = surgery_end_time + interval '24 hours',
        patient_exit_time = patient_exit_time + interval '24 hours',
        urpa_exit_time = urpa_exit_time + interval '24 hours',
        completed_time = completed_time + interval '24 hours',
        created_at = created_at + interval '24 hours',
        updated_at = updated_at + interval '24 hours'
    `);
    
    console.log("Successfully updated all dates +24 hours!");
  } catch (err) {
    console.error("Error updating dates:", err);
  } finally {
    process.exit(0);
  }
}

main();
