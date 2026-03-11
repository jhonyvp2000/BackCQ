import * as dotenv from "dotenv";
dotenv.config();

import { db } from "./src/db";
import { cqSurgeries } from "./src/db/schema";
import { getDashboardStats } from "./src/app/actions/dashboard";
import { sql, and, gte, lte } from "drizzle-orm";

async function main() {
    console.log("Supabase URL:", process.env.SUPABASE_URL); // To check loading

    // Fetch directly from DB with raw SQL to see raw stored strings
    const raw = await db.execute(sql`SELECT id, "scheduled_date", status FROM "cq_surgeries"`);
    console.log("Raw SQL Surgeries:", raw);

    const targetDate = new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log("Start Filter:", startOfDay.toISOString());
    console.log("End Filter:", endOfDay.toISOString());

    const queryRes = await db.select({ date: cqSurgeries.scheduledDate }).from(cqSurgeries).where(and(gte(cqSurgeries.scheduledDate, startOfDay), lte(cqSurgeries.scheduledDate, endOfDay)));
    console.log("Query Result Length:", queryRes.length);

    process.exit(0);
}

main().catch(console.error);
