import "dotenv/config";
import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function runCleanup2() {
  try {
    const r1 = await db.execute(sql`
       SELECT COUNT(*) FROM "cq_surgeries" 
       WHERE "patient_id"::text NOT IN (SELECT "dni" FROM "cq_patients")
       AND "patient_id"::text NOT IN (SELECT "id"::text FROM "users")
       AND "patient_id"::text NOT IN (SELECT "dni" FROM "users");
    `);
    console.log("Orphaned surgeries:", r1[0]);

    // Let's delete surgeries that don't belong to any valid patient anywhere
    const del1 = await db.execute(sql`
       DELETE FROM "cq_surgeries" 
       WHERE "patient_id"::text NOT IN (SELECT "dni" FROM "cq_patients")
       AND "patient_id"::text NOT IN (SELECT "id"::text FROM "users")
       AND "patient_id"::text NOT IN (SELECT "dni" FROM "users");
    `);
    console.log("Deleted orphaned surgeries:", del1.length);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runCleanup2();
