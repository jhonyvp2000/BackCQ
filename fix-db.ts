import { db } from './src/db';
import { cqSurgeries, cqSurgeryTeam, cqSurgeryDiagnoses, cqSurgeryProcedures } from './src/db/schema';
import { cqPatients, cqPatientPii } from './src/db/schema';
import { eq, or, isNull } from 'drizzle-orm';

async function cleanupDb() {
  console.log("Iniciando purga de programaciones quirúrgicas y dependencias...");
  
  // 1. Drizzle automatically handles cascades if defined in schema, but we can do it manually to be safe.
  try {
      await db.delete(cqSurgeryTeam);
      await db.delete(cqSurgeryDiagnoses);
      await db.delete(cqSurgeryProcedures);
      
      const res = await db.delete(cqSurgeries).returning({ deletedId: cqSurgeries.id });
      console.log(`✅ Eliminadas ${res.length} programaciones quirúrgicas (y sus dependencias en cascada).`);

      // 2. Delete patients with dummy/empty identities due to earlier glitches
      // We target the PII table first, get the related Patient IDs, then delete demographics table
      const dummyPatients = await db.select().from(cqPatientPii).where(
          or(
              isNull(cqPatientPii.dni),
              eq(cqPatientPii.dni, ""),
              eq(cqPatientPii.dni, "S/N"),
              eq(cqPatientPii.nombres, "NO IDENTIFICADO"),
              eq(cqPatientPii.nombres, "No Identificado")
          )
      );

      console.log(`Buscando posibles pacientes huérfanos/fantasma... Encontrados: ${dummyPatients.length}`);
      
      if (dummyPatients.length > 0) {
          const idsToDelete = dummyPatients.map(p => p.patientId);
          
          let deletedCount = 0;
          for (const pid of idsToDelete) {
             // Since PII is a 1-to-1 extension, we delete from demographics table (cqPatients)
             // and the foreign key cascade will destroy cqPatientPii automatically!
             if (pid) {
                 await db.delete(cqPatients).where(eq(cqPatients.id, pid));
                 deletedCount++;
             }
          }
          console.log(`✅ ${deletedCount} Pacientes huérfanos borrados del sistema permanentemente.`);
      }

  } catch (err) {
      console.error("❌ Error durante la limpieza:", err);
  }
}

cleanupDb().then(() => process.exit(0));
