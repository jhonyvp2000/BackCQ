import { db } from './src/db';
import { cqPatientPii, cqSurgeries } from './src/db/schema';
import { or, isNull, eq } from 'drizzle-orm';

async function checkGhosts() {
  const latestPii = await db.select().from(cqPatientPii).where(
      or(
          isNull(cqPatientPii.dni),
          eq(cqPatientPii.nombres, 'No Identificado'),
          eq(cqPatientPii.nombres, 'NO IDENTIFICADO')
      )
  );
  console.log('PATIENT PII GHOSTS:');
  console.log(JSON.stringify(latestPii, null, 2));

  const surgeries = await db.select().from(cqSurgeries);
  console.log('SURGERIES TOTAL:', surgeries.length);
  process.exit(0);
}

checkGhosts();
