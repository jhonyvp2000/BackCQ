const { db } = require('./src/db');
const { cqSurgeries, cqPatientPii } = require('./src/db/schema');
const { eq, and, gte, lte } = require('drizzle-orm');

async function findTestSurgeries() {
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
        // Filtrar por hoy 23/04/2026
        gte(cqSurgeries.createdAt, new Date('2026-04-23T00:00:00Z')),
        lte(cqSurgeries.createdAt, new Date('2026-04-23T23:59:59Z'))
      )
    );

    console.log('Resultados encontrados:', JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findTestSurgeries();
