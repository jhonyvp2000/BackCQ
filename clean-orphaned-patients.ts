import "dotenv/config";
import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function cleanOrphans() {
  console.log("Detecting and deleting demographic records without PII...");
  try {
    const result = await db.execute(sql`
      DELETE FROM "cq_patients"
      WHERE "id" NOT IN (SELECT "patient_id" FROM "cq_patient_pii")
      RETURNING id;
    `);
    console.log(`Successfully deleted ${result.length} incomplete patient records.`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

cleanOrphans();
