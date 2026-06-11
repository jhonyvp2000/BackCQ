import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { cqProcedures, cqSurgeryProcedures } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

// MAPEO DE PROCEDIMIENTOS TEMPORALES A OFICIALES CPMS
const PROCEDURES_MAP: Record<string, { code: string; name: string }> = {
    "P-TMP-2550": { code: "49585", name: "CORRECCION DE HERNIA UMBILICAL, 5 AÑOS DE EDAD O MAYOR; REDUCIBLE" },
    "P-TMP-1898": { code: "58260", name: "HISTERECTOMIA VAGINAL DE UTERO DE 250 GRAMOS O MENOR" }
};

const DRY_RUN = process.argv.includes("--commit") ? false : true;

async function main() {
    console.log(`====================================================================`);
    console.log(`MIGRACIÓN DE PROCEDIMIENTOS MANUALES A CPMS OFICIALES`);
    console.log(`MODO: ${DRY_RUN ? "--- SIMULACIÓN (DRY RUN) ---" : "### COMPROMISO REAL (COMMIT) ###"}`);
    console.log(`Para ejecutar los cambios reales, corra con el parámetro: --commit`);
    console.log(`====================================================================\n`);

    try {
        const oldCodes = Object.keys(PROCEDURES_MAP);

        for (const oldCode of oldCodes) {
            const target = PROCEDURES_MAP[oldCode];
            
            // 1. Buscar si existe el registro manual en la BD
            const tempProc = await db.select().from(cqProcedures).where(eq(cqProcedures.code, oldCode)).limit(1);
            if (tempProc.length === 0) {
                console.log(`[-] [Omitido] Código manual '${oldCode}' no encontrado en cq_procedures.`);
                continue;
            }
            
            const oldProcRecord = tempProc[0];
            const oldId = oldProcRecord.id;
            const newCode = target.code;
            const newName = target.name;

            // 2. Verificar si el código oficial ya existe en la BD
            const existingOfficial = await db.select().from(cqProcedures).where(eq(cqProcedures.code, newCode)).limit(1);
            
            if (existingOfficial.length > 0 && existingOfficial[0]) {
                // CASO B: EL CÓDIGO OFICIAL YA EXISTE EN LA BD -> FUSIÓN (MERGE)
                const officialId = existingOfficial[0].id;
                console.log(`[~] [FUSIÓN] '${oldCode}' ("${oldProcRecord.name}") -> FUSIONAR CON '${newCode}' ("${existingOfficial[0].name}")`);
                
                if (!DRY_RUN) {
                    // Re-direccionar las relaciones de cirugías
                    const refs = await db.select().from(cqSurgeryProcedures).where(eq(cqSurgeryProcedures.procedureId, oldId));
                    for (const ref of refs) {
                        const hasOfficial = await db.select().from(cqSurgeryProcedures)
                            .where(and(eq(cqSurgeryProcedures.surgeryId, ref.surgeryId), eq(cqSurgeryProcedures.procedureId, officialId)))
                            .limit(1);
                        if (hasOfficial.length > 0) {
                            // Si la cirugía ya tiene el procedimiento oficial, eliminamos la referencia temporal duplicada
                            await db.delete(cqSurgeryProcedures).where(and(eq(cqSurgeryProcedures.surgeryId, ref.surgeryId), eq(cqSurgeryProcedures.procedureId, oldId)));
                            console.log(`    -> [Eliminado] Relación duplicada de cirugía ${ref.surgeryId}`);
                        } else {
                            // Si no lo tiene, re-apuntamos la referencia temporal al id oficial
                            await db.update(cqSurgeryProcedures)
                                .set({ procedureId: officialId })
                                .where(and(eq(cqSurgeryProcedures.surgeryId, ref.surgeryId), eq(cqSurgeryProcedures.procedureId, oldId)));
                            console.log(`    -> [Actualizado] Re-asociada cirugía ${ref.surgeryId} al ID oficial`);
                        }
                    }

                    // Eliminar el registro de procedimiento manual temporal duplicado
                    await db.delete(cqProcedures).where(eq(cqProcedures.id, oldId));
                    console.log(`    [+] Eliminado procedimiento manual temporal duplicado del catálogo.`);
                } else {
                    const refsCount = await db.select().from(cqSurgeryProcedures).where(eq(cqSurgeryProcedures.procedureId, oldId));
                    console.log(`    (Simulación) Re-asociaría ${refsCount.length} cirugías y eliminaría '${oldCode}' del catálogo.`);
                }
            } else {
                // CASO A: EL CÓDIGO OFICIAL NO EXISTE -> RENOMBRAR DIRECTAMENTE (UPDATE)
                console.log(`[*] [RENOMBRAR] '${oldCode}' ("${oldProcRecord.name}") -> RENOMBRAR A '${newCode}' ("${newName}")`);
                
                if (!DRY_RUN) {
                    await db.update(cqProcedures)
                        .set({
                            code: newCode,
                            name: newName,
                            isVerifiedMinsa: true
                        })
                        .where(eq(cqProcedures.id, oldId));
                    console.log(`    [+] Registro actualizado exitosamente en el catálogo.`);
                } else {
                    console.log(`    (Simulación) Actualizaría código a '${newCode}', nombre a '${newName}' y isVerifiedMinsa = true.`);
                }
            }
        }

        console.log(`\n====================================================================`);
        console.log(`Proceso finalizado.`);
        console.log(`====================================================================`);

    } catch (e) {
        console.error("Error durante el proceso de migración de procedimientos:", e);
    } finally {
        process.exit(0);
    }
}

main();
