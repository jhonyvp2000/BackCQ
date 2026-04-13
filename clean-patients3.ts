import "dotenv/config";
import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function runCleanup3() {
  const r1 = await db.execute(sql`
     SELECT COUNT(*) FROM "cq_surgeries" 
     WHERE "patient_id"::text NOT IN (SELECT "dni" FROM "cq_patients")
     AND "patient_id"::text NOT IN (SELECT "id"::text FROM "users")
     AND "patient_id"::text NOT IN (SELECT "dni" FROM "users");
  `);
  console.log("Remaining orphaned surgeries:", r1[0]);
  process.exit(0);
}
runCleanup3();
