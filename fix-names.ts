import "dotenv/config";
import { db } from "./src/db";
import { cqPatientPii } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    await db.update(cqPatientPii)
        .set({ nombres: 'Jhony', apellidos: 'Vela Paredes' })
        .where(eq(cqPatientPii.dni, '09791568'));

    await db.update(cqPatientPii)
        .set({ nombres: 'Paciente de Prueba', apellidos: 'RENIEC' })
        .where(eq(cqPatientPii.dni, '12345678'));

    console.log("Updated mock patients");
    process.exit(0);
}

main().catch(console.error);
