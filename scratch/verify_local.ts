import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { cqDiagnoses } from "../src/db/schema";
import { eq, like, or } from "drizzle-orm";

async function verify() {
    console.log("=========================================================");
    console.log("VERIFICACIÓN POST-MIGRACIÓN LOCAL");
    console.log("=========================================================");

    try {
        // Query temporary/manual codes
        const tempCodes = await db.select()
            .from(cqDiagnoses)
            .where(
                or(
                    like(cqDiagnoses.code, "D-TMP-%"),
                    eq(cqDiagnoses.isVerifiedMinsa, false)
                )
            );

        console.log(`Diagnósticos con código D-TMP-% o no verificados: ${tempCodes.length}`);
        if (tempCodes.length > 0) {
            console.log("Detalles:");
            tempCodes.forEach(dx => console.log(`- ID: ${dx.id}, Código: ${dx.code}, Nombre: ${dx.name}, MinsaVerified: ${dx.isVerifiedMinsa}`));
        } else {
            console.log("[✔] ¡Éxito! Todos los diagnósticos manuales han sido regularizados y no queda ninguno.");
        }
    } catch (e) {
        console.error("Error durante la verificación:", e);
    } finally {
        process.exit(0);
    }
}

verify();
