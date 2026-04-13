import { db } from "./src/db";
import { cqDiagnoses, cqProcedures } from "./src/db/schema";

async function purgeCatalogs() {
    console.log("🔥 INICIANDO PURGA DE CATÁLOGOS DE PRUEBA 🔥");

    try {
        console.log("Desintegrando Diagnósticos (CIE-10) creados en pruebas...");
        const dDiag = await db.delete(cqDiagnoses).returning();
        console.log(`✅ ${dDiag.length} Diagnósticos maestros eliminados.`);

        console.log("Desintegrando Procedimientos Quirúrgicos listados...");
        const dProc = await db.delete(cqProcedures).returning();
        console.log(`✅ ${dProc.length} Procedimientos eliminados.`);

        console.log(" ");
        console.log("🚀 ¡Catálogos limpiados exitosamente! 🚀");
        process.exit(0);

    } catch (e) {
        console.error("❌ ERROR DURANTE LA PURGA: ", e);
        process.exit(1);
    }
}

purgeCatalogs();
