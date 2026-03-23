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
  console.log("Eliminando diagnóstico con código sasasa03...");

  try {
    const deletedId = await db.delete(schema.cqDiagnoses)
        .where(eq(schema.cqDiagnoses.code, 'sasasa03'))
        .returning({ deletedId: schema.cqDiagnoses.id });

    if (deletedId.length > 0) {
        console.log(`✅ Diagnóstico sasasa03 eliminado exitosamente. ID: ${deletedId[0].deletedId}`);
    } else {
        console.log(`⚠️  No se encontró ningún diagnóstico con código sasasa03.`);
    }

  } catch (err) {
    console.error("Error al eliminar el diagnóstico:", err);
  } finally {
    process.exit(0);
  }
}

main();
