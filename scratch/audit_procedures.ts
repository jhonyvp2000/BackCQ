import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { cqProcedures, cqSurgeryProcedures } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("=========================================================");
    console.log("AUDITORÍA DE PROCEDIMIENTOS MANUALES");
    console.log("=========================================================");

    try {
        // Find all unverified procedures
        const manualProcs = await db.select()
            .from(cqProcedures)
            .where(eq(cqProcedures.isVerifiedMinsa, false));

        console.log(`Procedimientos manuales (isVerifiedMinsa = false): ${manualProcs.length}`);
        
        for (const proc of manualProcs) {
            // Count surgeries referencing this procedure
            const refs = await db.select()
                .from(cqSurgeryProcedures)
                .where(eq(cqSurgeryProcedures.procedureId, proc.id));

            console.log(`- ID: ${proc.id} | Código: ${proc.code} | Nombre: ${proc.name} | Cirugías vinculadas: ${refs.length}`);
        }

    } catch (e) {
        console.error("Error al auditar procedimientos:", e);
    } finally {
        process.exit(0);
    }
}

main();
