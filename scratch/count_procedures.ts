import dotenv from "dotenv";
dotenv.config({ override: true });
console.log("DATABASE_URL:", process.env.DATABASE_URL);

import { db } from "../src/db";
import { cqProcedures } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function count() {
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(cqProcedures);
        console.log(`TOTAL_PROCEDURES:${result[0].count}`);
    } catch (e) {
        console.error("Error al contar:", e);
    } finally {
        process.exit(0);
    }
}

count();
