import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { eq, inArray } from 'drizzle-orm';
import { 
    cqPatientPii, cqPatients, cqSurgeries, 
    cqSurgeryTeam, cqSurgicalReports, cqSurgeryDiagnoses, 
    cqSurgeryProcedures, cqSurgeryInterventions 
} from './src/db/schema';

dotenv.config();

async function main() {
  console.log("Connecting to", process.env.DATABASE_URL);
  const client = postgres(process.env.DATABASE_URL as string);
  const db = drizzle(client);
  
  try {
    const targetDni = '009483747';
    console.log(`Buscando paciente con DNI ${targetDni}...`);
    
    // 1. Encontrar el paciente
    const patientRecord = await db.select().from(cqPatientPii).where(eq(cqPatientPii.dni, targetDni));
    
    if (patientRecord.length === 0) {
        console.log("No se encontró ningún paciente con ese DNI.");
        return;
    }
    
    const pId = patientRecord[0].patientId;
    console.log(`Paciente encontrado. ID: ${pId}`);
    
    // 2. Encontrar cirugías del paciente
    const surgeries = await db.select().from(cqSurgeries).where(eq(cqSurgeries.patientId, pId));
    
    if (surgeries.length === 0) {
        console.log("El paciente no tiene cirugías registradas.");
    } else {
        const sIds = surgeries.map(s => s.id);
        console.log(`Se encontraron ${sIds.length} cirugías. Eliminando dependencias en cascada...`);
        
        // Drizzle/Postgres CASCADE normally handles this, but we'll enforce it just in case:
        await db.delete(cqSurgeryTeam).where(inArray(cqSurgeryTeam.surgeryId, sIds));
        await db.delete(cqSurgicalReports).where(inArray(cqSurgicalReports.surgeryId, sIds));
        
        // These might not be strictly needed if ON DELETE CASCADE is set, but better safe than sorry
        try { await db.delete(cqSurgeryDiagnoses).where(inArray(cqSurgeryDiagnoses.surgeryId, sIds)); } catch(e){}
        try { await db.delete(cqSurgeryProcedures).where(inArray(cqSurgeryProcedures.surgeryId, sIds)); } catch(e){}
        try { await db.delete(cqSurgeryInterventions).where(inArray(cqSurgeryInterventions.surgeryId, sIds)); } catch(e){}
        
        // Eliminar cirugías
        await db.delete(cqSurgeries).where(inArray(cqSurgeries.id, sIds));
        console.log("Cirugías y dependencias eliminadas correctamente.");
    }
    
    // 3. Eliminar paciente
    console.log("Eliminando registro del paciente...");
    await db.delete(cqPatientPii).where(eq(cqPatientPii.patientId, pId));
    await db.delete(cqPatients).where(eq(cqPatients.id, pId));
    
    console.log("¡Limpieza total completada con éxito!");

  } catch (err) {
    console.error("Error durante la eliminación:", err);
  } finally {
    await client.end();
  }
}

main();
