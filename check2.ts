import "dotenv/config";
import { db } from "./src/db";
import { cqSurgeries } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function main() {
    const todayStr = '2026-03-11';

    // Testing EXACT query used in dashboard actions
    const todaySurgeries = await db
        .select({ status: cqSurgeries.status, id: cqSurgeries.id })
        .from(cqSurgeries)
        .where(sql`DATE(scheduled_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima') = ${todayStr}::date`);

    console.log("SURGERIES:", todaySurgeries);
    process.exit(0);
}

main().catch(console.error);
