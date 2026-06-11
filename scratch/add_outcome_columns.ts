import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("=========================================================");
        console.log("RUNNING DATABASE MIGRATION: ADD OUTCOME COLUMNS");
        console.log("=========================================================");

        const queries = [
            sql`ALTER TABLE cq_surgeries ADD COLUMN IF NOT EXISTS is_reintervention boolean DEFAULT false NOT NULL;`,
            sql`ALTER TABLE cq_surgeries ADD COLUMN IF NOT EXISTS has_hypoxic_encephalopathy boolean DEFAULT false NOT NULL;`,
            sql`ALTER TABLE cq_surgeries ADD COLUMN IF NOT EXISTS has_urpa_complication boolean DEFAULT false NOT NULL;`,
            sql`ALTER TABLE cq_surgeries ADD COLUMN IF NOT EXISTS died_in_surgery boolean DEFAULT false NOT NULL;`,
            sql`ALTER TABLE cq_surgeries ADD COLUMN IF NOT EXISTS died_in_urpa boolean DEFAULT false NOT NULL;`
        ];

        for (const query of queries) {
            await db.execute(query);
            console.log("Executed query successfully.");
        }

        console.log("Database migration completed successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit(0);
    }
}

main();
