import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { cqSurgeries } from "../src/db/schema";
import { like, or } from "drizzle-orm";

async function audit() {
    console.log("=========================================================");
    console.log("AUDITORÍA DE TEXTOS EN CQ_SURGERIES");
    console.log("=========================================================");

    try {
        const affectedSurgeries = await db.select({
            id: cqSurgeries.id,
            diagnosis: cqSurgeries.diagnosis,
            postDiagnosis: cqSurgeries.postDiagnosis,
            scheduledDate: cqSurgeries.scheduledDate
        })
        .from(cqSurgeries)
        .where(
            or(
                like(cqSurgeries.diagnosis, "%D-TMP-%"),
                like(cqSurgeries.postDiagnosis, "%D-TMP-%")
            )
        );

        console.log(`Programaciones quirúrgicas afectadas: ${affectedSurgeries.length}`);
        affectedSurgeries.slice(0, 10).forEach(s => {
            console.log(`- ID: ${s.id}, Fecha: ${s.scheduledDate}`);
            console.log(`  Diag:  ${s.diagnosis}`);
            console.log(`  Post:  ${s.postDiagnosis}`);
        });

    } catch (e) {
        console.error("Error al auditar:", e);
    } finally {
        process.exit(0);
    }
}

audit();
