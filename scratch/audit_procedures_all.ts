import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { cqProcedures } from "../src/db/schema";
import { like } from "drizzle-orm";

async function main() {
    try {
        const matches = await db.select()
            .from(cqProcedures)
            .where(like(cqProcedures.code, "P-TMP-%"));

        console.log(`Procedimientos que empiezan con P-TMP-: ${matches.length}`);
        matches.forEach(p => console.log(`- ID: ${p.id} | Código: ${p.code} | Nombre: ${p.name} | MinsaVerified: ${p.isVerifiedMinsa}`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

main();
