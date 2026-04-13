import "dotenv/config";
import { db } from "./src/db";
import { cqSurgeries, cqPatients, cqPatientPii, cqSurgeryTeam, cqSurgeryDiagnoses, cqSurgeryProcedures, cqSurgicalReports } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function purgeDatabaseForProduction() {
    console.log("🔥 INICIANDO PURGA TOTAL PARA PRODUCCIÓN 🔥");
    console.log("Se eliminarán todas las programaciones quirúrgicas, dependencias y pacientes...");

    try {
        // Borrar todo el Team, Diagnósticos y Procedimientos
        console.log("Borrando Equipos Médicos asignados...");
        await db.delete(cqSurgeryTeam);

        console.log("Borrando Diagnósticos Médicos asignados...");
        await db.delete(cqSurgeryDiagnoses);

        console.log("Borrando Procedimientos asignados...");
        await db.delete(cqSurgeryProcedures);

        console.log("Borrando Reportes Operatorios...");
        await db.delete(cqSurgicalReports);

        // Borramos las cirugias
        console.log("Borrando TODAS las cirugías...");
        const dSurgeries = await db.delete(cqSurgeries).returning();
        console.log(`✅ ${dSurgeries.length} Programaciones borradas.`);

        // Borramos los Pacientes (PII y Baseline)
        console.log("Borrando PII de Pacientes...");
        const dPii = await db.delete(cqPatientPii).returning();
        console.log(`✅ ${dPii.length} Cédulas de Identidad de Pacientes borradas.`);

        console.log("Borrando Pacientes (Entidad Maestro)...");
        const dPatients = await db.delete(cqPatients).returning();
        console.log(`✅ ${dPatients.length} Registros maestros de Pacientes eliminados.`);

        console.log(" ");
        console.log("🚀 ¡BASE DE DATOS LIMPIA Y LISTA PARA PRODUCCIÓN! 🚀");
        process.exit(0);

    } catch (e) {
        console.error("❌ ERROR DURANTE LA PURGA: ", e);
        process.exit(1);
    }
}

purgeDatabaseForProduction();
