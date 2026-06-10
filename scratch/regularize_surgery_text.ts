import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { cqSurgeries } from "../src/db/schema";
import { eq, like, or } from "drizzle-orm";

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

const DRY_RUN = process.argv.includes("--commit") ? false : true;

function regularizeText(textVal: string | null): { original: string | null, updated: string | null, modified: boolean } {
    if (!textVal) return { original: textVal, updated: textVal, modified: false };
    
    // Diagnoses can be comma separated, e.g. "D-TMP-5885 - GESTANTE 39 SS CA 2 V, K35.9 - Apendicitis"
    const parts = textVal.split(",").map(p => p.trim());
    let modified = false;
    
    const updatedParts = parts.map(part => {
        // Find if it has code - name structure
        const dashIndex = part.indexOf(" - ");
        if (dashIndex === -1) return part;
        
        const code = part.substring(0, dashIndex).trim();
        if (code.startsWith("D-TMP-")) {
            const mapped = DIAGNOSES_MAP[code];
            if (mapped) {
                modified = true;
                return `${mapped.code} - ${mapped.name}`;
            }
        }
        return part;
    });
    
    return {
        original: textVal,
        updated: modified ? updatedParts.join(", ") : textVal,
        modified
    };
}

async function main() {
    console.log(`====================================================================`);
    console.log(`MIGRACIÓN DE TEXTOS DE DIAGNÓSTICOS EN CQ_SURGERIES`);
    console.log(`MODO: ${DRY_RUN ? "--- SIMULACIÓN (DRY RUN) ---" : "### COMPROMISO REAL (COMMIT) ###"}`);
    console.log(`Para ejecutar los cambios reales, corra con el parámetro: --commit`);
    console.log(`====================================================================\n`);

    try {
        const surgeries = await db.select()
            .from(cqSurgeries)
            .where(
                or(
                    like(cqSurgeries.diagnosis, "%D-TMP-%"),
                    like(cqSurgeries.postDiagnosis, "%D-TMP-%")
                )
            );

        console.log(`Surgeries detected with old codes in texts: ${surgeries.length}\n`);

        for (const surg of surgeries) {
            const diagResult = regularizeText(surg.diagnosis);
            const postDiagResult = regularizeText(surg.postDiagnosis);

            if (diagResult.modified || postDiagResult.modified) {
                console.log(`[~] Surgery ID: ${surg.id} (Fecha programada: ${surg.scheduledDate})`);
                if (diagResult.modified) {
                    console.log(`  - Diagnosis:`);
                    console.log(`    DE : "${diagResult.original}"`);
                    console.log(`    A  : "${diagResult.updated}"`);
                }
                if (postDiagResult.modified) {
                    console.log(`  - PostDiagnosis:`);
                    console.log(`    DE : "${postDiagResult.original}"`);
                    console.log(`    A  : "${postDiagResult.updated}"`);
                }

                if (!DRY_RUN) {
                    await db.update(cqSurgeries)
                        .set({
                            diagnosis: diagResult.updated,
                            postDiagnosis: postDiagResult.updated
                        })
                        .where(eq(cqSurgeries.id, surg.id));
                    console.log(`    [+] Actualizado en la Base de Datos.`);
                }
                console.log("");
            }
        }

        console.log(`====================================================================`);
        console.log(`Proceso finalizado.`);
        console.log(`====================================================================`);

    } catch (e) {
        console.error("Error durante el proceso:", e);
    } finally {
        process.exit(0);
    }
}

main();
