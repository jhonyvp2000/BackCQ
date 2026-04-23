import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
import { cqSurgeries, cqPatientPii } from '../src/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

async function findTestSurgeries() {
  const DATABASE_URL = "postgresql://jvp_user:V3l4p4r3d3s@localhost:6432/ogess";
  const client = postgres(DATABASE_URL, { prepare: false });
  const db = drizzle(client, { schema });

  try {
    const patientName = 'JHONY';
    const patientLastName = 'VELA PAREDES';
    
    console.log(`Buscando cirugías para: ${patientName} ${patientLastName} del 2026-04-23`);

    const results = await db.select({
      surgeryId: cqSurgeries.id,
      patientName: cqPatientPii.nombres,
      patientLastName: cqPatientPii.apellidos,
      scheduledDate: cqSurgeries.scheduledDate,
      status: cqSurgeries.status
    })
    .from(cqSurgeries)
    .innerJoin(cqPatientPii, eq(cqSurgeries.patientId, cqPatientPii.patientId))
    .where(
      and(
        eq(cqPatientPii.nombres, patientName),
        eq(cqPatientPii.apellidos, patientLastName),
        gte(cqSurgeries.createdAt, new Date('2026-04-23T00:00:00Z')),
        lte(cqSurgeries.createdAt, new Date('2026-04-23T23:59:59Z'))
      )
    );

    console.log('Resultados encontrados:', JSON.stringify(results, null, 2));
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findTestSurgeries();
