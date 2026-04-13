import "dotenv/config";
import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function check() {
  const orphans = await db.execute(sql`SELECT * FROM "cq_patient_pii" WHERE nombres='NO IDENTIFICADO' OR nombres ILIKE '%(TEMP)%';`);
  console.log("Orphans currently in DB:", orphans.length);
  process.exit();
}
check();
