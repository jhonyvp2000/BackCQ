import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("=========================================================");
        console.log("EXPLAIN ANALYZE DE LA BÚSQUEDA DE PROCEDIMIENTOS");
        console.log("=========================================================");

        const query = "histerectomia";
        const sqlQuery = sql`
            EXPLAIN ANALYZE 
            SELECT * FROM cq_procedures 
            WHERE code ILIKE ${`%"${query}"%`} OR name ILIKE ${`%"${query}"%`} 
            LIMIT 20
        `;

        const result = await db.execute(sqlQuery);
        console.log(JSON.stringify(result, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

main();
