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
  console.log("Eliminando procedimiento con código SASASA-01...");

  try {
    const deletedId = await db.delete(schema.cqProcedures)
        .where(eq(schema.cqProcedures.code, 'SASASA-01'))
        .returning({ deletedId: schema.cqProcedures.id });

    if (deletedId.length > 0) {
        console.log(`✅ Procedimiento SASASA-01 eliminado exitosamente. ID: ${deletedId[0].deletedId}`);
    } else {
        console.log(`⚠️  No se encontró ningún procedimiento con código SASASA-01.`);
    }

  } catch (err) {
    console.error("Error al eliminar el procedimiento:", err);
  } finally {
    process.exit(0);
  }
}

main();
