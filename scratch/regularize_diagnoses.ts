import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { cqDiagnoses, cqSurgeryDiagnoses, cqSurgeryPostDiagnoses } from "../src/db/schema";
import { eq, and } from "drizzle-orm";

// MAPEO DE DIAGNÓSTICOS TEMPORALES A OFICIALES CIE-10
const DIAGNOSES_MAP: Record<string, { code: string; name: string }> = {
    "D-TMP-3101": { code: "L029", name: "ABSCESO CUTANEO, FURUNCULO Y ANTRAX DE SITIO NO ESPECIFICADO" },
    "D-TMP-1295": { code: "L020", name: "ABSCESO CUTANEO, FURUNCULO Y ANTRAX DE LA CARA" },
    "D-TMP-7916": { code: "O363", name: "ATENCION MATERNA POR SIGNOS DE HIPOXIA FETAL" },
    "D-TMP-5885": { code: "O342", name: "ATENCION MATERNA POR CICATRIZ UTERINA DEBIDA A CIRUGIA PREVIA" },
    "D-TMP-5732": { code: "O149", name: "PREECLAMPSIA, NO ESPECIFICADA" },
    "D-TMP-6533": { code: "J320", name: "SINUSITIS MAXILAR CRONICA" },
    "D-TMP-8007": { code: "S828", name: "FRACTURA DE OTRAS PARTES DE LA PIERNA" },
    "D-TMP-9979": { code: "Z302", name: "ESTERILIZACION" },
    "D-TMP-7029": { code: "Z390", name: "ATENCION Y EXAMEN INMEDIATAMENTE DESPUES DEL PARTO" },
    "D-TMP-9643": { code: "P519", name: "HEMORRAGIA UMBILICAL DEL RECIEN NACIDO, SIN OTRA ESPECIFICACION" },
    "D-TMP-8810": { code: "K650", name: "PERITONITIS AGUDA" },
    "D-TMP-917":  { code: "O48X", name: "EMBARAZO PROLONGADO" },
    "D-TMP-5646": { code: "H024", name: "BLEFAROPTOSIS" },
    "D-TMP-476":  { code: "O342", name: "ATENCION MATERNA POR CICATRIZ UTERINA DEBIDA A CIRUGIA PREVIA" },
    "D-TMP-3342": { code: "O335", name: "ATENCION MATERNA POR DESPROPORCION DEBIDA A FETO DEMASIADO GRANDE" },
    "D-TMP-6125": { code: "S424", name: "FRACTURA DE LA EPIFISIS INFERIOR DEL HUMERO" },
    "D-TMP-3921": { code: "K409", name: "HERNIA INGUINAL UNILATERAL O NO ESPECIFICADA, SIN OBSTRUCCION NI GANGRENA" },
    "D-TMP-338":  { code: "S999", name: "TRAUMATISMO DEL PIE Y DEL TOBILLO, NO ESPECIFICADO" },
    "D-TMP-2239": { code: "T200", name: "QUEMADURA DE LA CABEZA Y DEL CUELLO, GRADO NO ESPECIFICADO" },
    "D-TMP-8804": { code: "Z000", name: "EXAMEN MEDICO GENERAL" }
};

// Variable para definir si es ejecución real o simulación
const DRY_RUN = process.argv.includes("--commit") ? false : true;

async function main() {
    console.log(`====================================================================`);
    console.log(`MIGRACIÓN DE DIAGNÓSTICOS MANUALES A CIE-10 OFICIALES`);
    console.log(`MODO: ${DRY_RUN ? "--- SIMULACIÓN (DRY RUN) ---" : "### COMPROMISO REAL (COMMIT) ###"}`);
    console.log(`Para ejecutar los cambios reales, corra con el parámetro: --commit`);
    console.log(`====================================================================\n`);

    try {
        const oldCodes = Object.keys(DIAGNOSES_MAP);

        for (const oldCode of oldCodes) {
            const target = DIAGNOSES_MAP[oldCode];
            
            // 1. Buscar si existe el registro manual en la BD
            const tempDx = await db.select().from(cqDiagnoses).where(eq(cqDiagnoses.code, oldCode)).limit(1);
            if (tempDx.length === 0) {
                console.log(`[-] [Omitido] Código manual '${oldCode}' no encontrado en cq_diagnoses.`);
                continue;
            }
            
            const oldDxRecord = tempDx[0];
            const oldId = oldDxRecord.id;
            const newCode = target.code;
            const newName = target.name;

            // 2. Verificar si el código oficial ya existe en la BD
            const existingOfficial = await db.select().from(cqDiagnoses).where(eq(cqDiagnoses.code, newCode)).limit(1);
            
            if (existingOfficial.length > 0 && existingOfficial[0]) {
                // CASO B: EL CÓDIGO OFICIAL YA EXISTE EN LA BD -> FUSIÓN (MERGE)
                const officialId = existingOfficial[0].id;
                console.log(`[~] [FUSIÓN] '${oldCode}' ("${oldDxRecord.name}") -> FUSIONAR CON '${newCode}' ("${existingOfficial[0].name}")`);
                
                if (!DRY_RUN) {
                    // Re-direccionar las relaciones pre-operatorias
                    const preOps = await db.select().from(cqSurgeryDiagnoses).where(eq(cqSurgeryDiagnoses.diagnosisId, oldId));
                    for (const ref of preOps) {
                        const hasOfficial = await db.select().from(cqSurgeryDiagnoses)
                            .where(and(eq(cqSurgeryDiagnoses.surgeryId, ref.surgeryId), eq(cqSurgeryDiagnoses.diagnosisId, officialId)))
                            .limit(1);
                        if (hasOfficial.length > 0) {
                            // Si la cirugía ya tiene el diagnóstico oficial, simplemente eliminamos la referencia temporal
                            await db.delete(cqSurgeryDiagnoses).where(and(eq(cqSurgeryDiagnoses.surgeryId, ref.surgeryId), eq(cqSurgeryDiagnoses.diagnosisId, oldId)));
                            console.log(`    -> [Eliminado] Relación duplicada de cirugía ${ref.surgeryId}`);
                        } else {
                            // Si no lo tiene, re-apuntamos la referencia temporal al id oficial
                            await db.update(cqSurgeryDiagnoses)
                                .set({ diagnosisId: officialId })
                                .where(and(eq(cqSurgeryDiagnoses.surgeryId, ref.surgeryId), eq(cqSurgeryDiagnoses.diagnosisId, oldId)));
                            console.log(`    -> [Actualizado] Re-asociada cirugía ${ref.surgeryId} al ID oficial`);
                        }
                    }

                    // Re-direccionar las relaciones post-operatorias (por si acaso)
                    const postOps = await db.select().from(cqSurgeryPostDiagnoses).where(eq(cqSurgeryPostDiagnoses.diagnosisId, oldId));
                    for (const ref of postOps) {
                        const hasOfficial = await db.select().from(cqSurgeryPostDiagnoses)
                            .where(and(eq(cqSurgeryPostDiagnoses.surgeryId, ref.surgeryId), eq(cqSurgeryPostDiagnoses.diagnosisId, officialId)))
                            .limit(1);
                        if (hasOfficial.length > 0) {
                            await db.delete(cqSurgeryPostDiagnoses).where(and(eq(cqSurgeryPostDiagnoses.surgeryId, ref.surgeryId), eq(cqSurgeryPostDiagnoses.diagnosisId, oldId)));
                            console.log(`    -> [Eliminado-Post] Relación duplicada de cirugía ${ref.surgeryId}`);
                        } else {
                            await db.update(cqSurgeryPostDiagnoses)
                                .set({ diagnosisId: officialId })
                                .where(and(eq(cqSurgeryPostDiagnoses.surgeryId, ref.surgeryId), eq(cqSurgeryPostDiagnoses.diagnosisId, oldId)));
                            console.log(`    -> [Actualizado-Post] Re-asociada cirugía ${ref.surgeryId} al ID oficial`);
                        }
                    }

                    // Eliminar el registro de diagnóstico manual temporal duplicado
                    await db.delete(cqDiagnoses).where(eq(cqDiagnoses.id, oldId));
                    console.log(`    [+] Eliminado diagnóstico manual temporal duplicado del catálogo.`);
                } else {
                    console.log(`    (Simulación) Re-asociaría las cirugías y eliminaría '${oldCode}' del catálogo.`);
                }
            } else {
                // CASO A: EL CÓDIGO OFICIAL NO EXISTE -> RENOMBRAR DIRECTAMENTE (UPDATE)
                console.log(`[*] [RENOMBRAR] '${oldCode}' ("${oldDxRecord.name}") -> RENOMBRAR A '${newCode}' ("${newName}")`);
                
                if (!DRY_RUN) {
                    await db.update(cqDiagnoses)
                        .set({
                            code: newCode,
                            name: newName,
                            isVerifiedMinsa: true
                        })
                        .where(eq(cqDiagnoses.id, oldId));
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
        console.error("Error durante el proceso de migración:", e);
    } finally {
        process.exit(0);
    }
}

main();
