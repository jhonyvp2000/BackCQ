import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found in environment");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log("Iniciando eliminación del paciente DNI 09791569...");

  try {
    const piiResult = await db.select().from(schema.cqPatientPii)
      .where(eq(schema.cqPatientPii.dni, '09791569'));

    if (piiResult.length === 0) {
      console.log("❌ No se encontró el paciente en la BD.");
      process.exit(0);
    }
    const patientId = piiResult[0].patientId;

    // Eliminación directa desde la tabla principal (cq_patients). 
    // Debido a onDelete: 'cascade', esto borrará automáticamente sus datos sensibles en cq_patient_pii.
    await db.delete(schema.cqPatients).where(eq(schema.cqPatients.id, patientId));

    console.log(`✅ Paciente eliminado con éxito conjuntamente a todas sus dependencias en cascada.`);
    console.log(`(ID UUID Borrado: ${patientId})`);

  } catch (err) {
    console.error("Error al eliminar el paciente:", err);
  } finally {
    process.exit(0);
  }
}

main();
