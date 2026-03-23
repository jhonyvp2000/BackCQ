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
  console.log("Iniciando la reasignación de pacientes repetidos en programaciones...");

  try {
    // 1. Obtener todas las programaciones (cirugías)
    const surgeries = await db.select().from(schema.cqSurgeries);
    
    // 2. Obtener todos los pacientes disponibles
    const allPatients = await db.select().from(schema.cqPatients);
    
    const seenPatientIds = new Set<string>();
    const availablePatients = [...allPatients];
    let updatedCount = 0;

    for (const surgery of surgeries) {
      if (seenPatientIds.has(surgery.patientId)) {
        // Encontramos un paciente repetido. Asignaremos uno nuevo.
        let newPatient = null;
        
        // Buscar un paciente que NO haya sido asignado aún
        for (const p of availablePatients) {
          if (!seenPatientIds.has(p.id)) {
            newPatient = p;
            break;
          }
        }

        if (newPatient) {
          console.log(`Actualizando programación (ID: ${surgery.id}): Paciente anterior: ${surgery.patientId} -> Nuevo: ${newPatient.id}`);
          
          await db.update(schema.cqSurgeries)
            .set({ patientId: newPatient.id })
            .where(eq(schema.cqSurgeries.id, surgery.id));
            
          seenPatientIds.add(newPatient.id);
          updatedCount++;
        } else {
          console.log(`⚠️ No hay más pacientes disponibles para reasignar la programación ${surgery.id}`);
        }
      } else {
        // Es la primera vez que vemos a este paciente en las cirugías, lo registramos.
        seenPatientIds.add(surgery.patientId);
      }
    }

    console.log(`✅ Proceso finalizado. Se actualizaron ${updatedCount} programaciones con nuevos pacientes.`);
  } catch (err) {
    console.error("Error al actualizar las programaciones:", err);
  } finally {
    process.exit(0);
  }
}

main();
