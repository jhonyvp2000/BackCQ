import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
import { cqSurgeries, cqSurgeryTeam, cqSurgeryDiagnoses, cqSurgeryProcedures, cqSurgeryInterventions, cqSurgicalReports } from '../src/db/schema';
import { eq, inArray } from 'drizzle-orm';

async function deleteTestSurgeries() {
  const DATABASE_URL = "postgresql://jvp_user:V3l4p4r3d3s@localhost:6432/ogess";
  const client = postgres(DATABASE_URL, { prepare: false });
  const db = drizzle(client, { schema });

  const surgeryIds = [
    "719dcfad-f624-4e66-9a58-48ce5df59e8e",
    "a2c1bf9a-4d5e-4970-9781-df27b48bb144"
  ];

  try {
    console.log(`Iniciando eliminación de cirugías: ${surgeryIds.join(', ')}`);

    // 1. Eliminar relaciones (aunque tengan cascade, lo hacemos explícito para seguridad)
    console.log('Eliminando equipo quirúrgico...');
    await db.delete(cqSurgeryTeam).where(inArray(cqSurgeryTeam.surgeryId, surgeryIds));

    console.log('Eliminando diagnósticos...');
    await db.delete(cqSurgeryDiagnoses).where(inArray(cqSurgeryDiagnoses.surgeryId, surgeryIds));

    console.log('Eliminando procedimientos...');
    await db.delete(cqSurgeryProcedures).where(inArray(cqSurgeryProcedures.surgeryId, surgeryIds));

    console.log('Eliminando intervenciones...');
    await db.delete(cqSurgeryInterventions).where(inArray(cqSurgeryInterventions.surgeryId, surgeryIds));

    console.log('Eliminando reportes operatorios...');
    await db.delete(cqSurgicalReports).where(inArray(cqSurgicalReports.surgeryId, surgeryIds));

    // 2. Eliminar las cirugías principales
    console.log('Eliminando registros de cirugía principales...');
    await db.delete(cqSurgeries).where(inArray(cqSurgeries.id, surgeryIds));

    console.log('Eliminación completada con éxito.');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error durante la eliminación:', error);
    process.exit(1);
  }
}

deleteTestSurgeries();
