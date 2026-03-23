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
  const oldDni = '10033228';
  const newDni = '41843861';

  console.log(`Iniciando reemplazo maestro: DNI Fantasma [${oldDni}] -> DNI Final [${newDni}]`);

  try {
    // 1. Buscar al paciente huérfano/fantasma
    const oldPatientQuery = await db.select().from(schema.cqPatientPii).where(eq(schema.cqPatientPii.dni, oldDni));
    
    if (oldPatientQuery.length === 0) {
      console.log(`❌ No se encontró ningún paciente con el DNI fantasma (${oldDni}).`);
      process.exit(0);
    }
    const oldPatientId = oldPatientQuery[0].patientId;

    // 2. Buscar si el DNI destino ya existe en el sistema
    const targetPatientQuery = await db.select().from(schema.cqPatientPii).where(eq(schema.cqPatientPii.dni, newDni));

    if (targetPatientQuery.length > 0) {
        console.log(`⚠️ El DNI de destino (${newDni}) ya existe en la base de datos.`);
        const targetPatientId = targetPatientQuery[0].patientId;
        
        if (targetPatientId === oldPatientId) {
            console.log("❌ Los IDs son identicos, nada que hacer.");
            process.exit(0);
        }

        // Fusionamos cirugías
        console.log(`Transfiriendo todas las cirugías hacia el DNI ${newDni}...`);
        const result = await db.update(schema.cqSurgeries)
            .set({ patientId: targetPatientId })
            .where(eq(schema.cqSurgeries.patientId, oldPatientId));

        console.log(`Destruyendo identidad fantasma residual (${oldDni})...`);
        await db.delete(schema.cqPatients).where(eq(schema.cqPatients.id, oldPatientId));

        console.log(`✅ ¡Fusión Completa! Se transfirieron cirugías y se depuró al fantasma.`);

    } else {
        console.log(`El DNI de destino (${newDni}) NO existe. Actualizando datos directamente sobre la identidad fantasma...`);
        
        await db.update(schema.cqPatientPii)
            .set({ 
                dni: newDni, 
                historiaClinica: newDni 
            })
            .where(eq(schema.cqPatientPii.patientId, oldPatientId));

        console.log(`✅ ¡Modificación Completa! El registro original mutó exitosamente al DNI ${newDni} sin perder sus cirugías hijas.`);
    }

  } catch (err) {
    console.error("Error crítico de base de datos:", err);
  } finally {
    process.exit(0);
  }
}

main();
