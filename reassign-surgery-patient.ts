import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema';
import * as dotenv from 'dotenv';
import { eq, notInArray, sql } from 'drizzle-orm';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found in environment");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log("Buscando paciente actual con DNI 10033228...");

  try {
    // 1. Obtener el UUID del paciente original
    const oldPatientQuery = await db.select().from(schema.cqPatientPii)
      .where(eq(schema.cqPatientPii.dni, '10033228'));

    if (oldPatientQuery.length === 0) {
      console.log("❌ No se encontró el paciente original (10033228).");
      process.exit(0);
    }
    const oldPatientId = oldPatientQuery[0].patientId;

    // 2. Obtener lista de IDs de pacientes que YA tienen cirugías programadas
    const busyPatientIdsQuery = await db.select({ id: schema.cqSurgeries.patientId }).from(schema.cqSurgeries);
    const busyPatientIds = busyPatientIdsQuery.map(r => r.id);

    // 3. Obtener un paciente libre (cuyo ID NO esté en la lista de busyPatientIds y no sea el original)
    // Para simplificar, obtenemos todos los pacientes y filtramos
    const allPatients = await db.select().from(schema.cqPatientPii);
    const availablePatients = allPatients.filter(p => !busyPatientIds.includes(p.patientId) && p.patientId !== oldPatientId);

    if (availablePatients.length === 0) {
      console.log("⚠️ No hay pacientes libres en la base de datos.");
      console.log("Todos los pacientes ya tienen programada al menos una cirugía.");
      process.exit(0);
    }

    const newPatient = availablePatients[0];
    
    // 4. Contar cuántas cirugías se van a actualizar
    const surgeriesToUpdate = await db.select().from(schema.cqSurgeries)
      .where(eq(schema.cqSurgeries.patientId, oldPatientId));

    if (surgeriesToUpdate.length === 0) {
      console.log("⚠️ El paciente 10033228 no tiene ninguna programación quirúrgica.");
      process.exit(0);
    }

    // 5. Realizar el cambio
    await db.update(schema.cqSurgeries)
      .set({ patientId: newPatient.patientId })
      .where(eq(schema.cqSurgeries.patientId, oldPatientId));

    console.log(`✅ ¡Éxito!`);
    console.log(`Se actualizaron ${surgeriesToUpdate.length} programaciones.`);
    console.log(`DNI Original (Reemplazado): 10033228`);
    console.log(`DNI Nuevo (Asignado): ${newPatient.dni} (${newPatient.nombres} ${newPatient.apellidos})`);

  } catch (err) {
    console.error("Error al actualizar la base de datos:", err);
  } finally {
    process.exit(0);
  }
}

main();
