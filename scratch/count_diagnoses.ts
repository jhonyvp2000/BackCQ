import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { cqDiagnoses } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function count() {
    try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(cqDiagnoses);
        console.log(`TOTAL_COUNT:${result[0].count}`);
    } catch (e) {
        console.error("Error al contar:", e);
    } finally {
        process.exit(0);
    }
}

count();
