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
  try {
    const result = await db
      .select()
      .from(schema.cqPatientPii)
      .leftJoin(schema.cqPatients, eq(schema.cqPatientPii.patientId, schema.cqPatients.id))
      .where(eq(schema.cqPatientPii.dni, '09791569'));

    if (result.length > 0) {
      console.log(JSON.stringify(result[0], null, 2));
    } else {
      console.log("No se encontró ningún paciente con el DNI 09791569");
    }
  } catch (err) {
    console.error("Error consultando paciente:", err);
  } finally {
    process.exit(0);
  }
}

main();
