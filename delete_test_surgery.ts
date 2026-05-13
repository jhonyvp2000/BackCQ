import { config } from "dotenv";
config({ path: '.env.local' });
config({ path: '.env' });
import { db } from "./src/db/index";
import { cqSurgeries, cqPatientPii } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Buscando paciente DNI 09791569...");
    const piiRecords = await db.select().from(cqPatientPii).where(eq(cqPatientPii.dni, "09791569"));
    
    if (piiRecords.length === 0) {
        console.log("No se encontró paciente con ese DNI.");
        process.exit(0);
    }

    const patientId = piiRecords[0].patientId;
    console.log(`Paciente encontrado: ${piiRecords[0].nombres} ${piiRecords[0].apellidos} (ID: ${patientId})`);

    const surgeries = await db.select().from(cqSurgeries).where(eq(cqSurgeries.patientId, patientId));
    console.log(`Se encontraron ${surgeries.length} programaciones quirúrgicas asociadas.`);

    for (const surgery of surgeries) {
        console.log(`Eliminando programación ID: ${surgery.id}`);
        // Due to CASCADE on foreign keys, deleting from cqSurgeries deletes children.
        await db.delete(cqSurgeries).where(eq(cqSurgeries.id, surgery.id));
    }

    console.log("Programaciones eliminadas en cascada.");
    process.exit(0);
}

main().catch(console.error);
