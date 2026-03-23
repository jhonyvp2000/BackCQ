import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const pgConnectionString = process.env.DATABASE_URL;

if (!pgConnectionString) {
  console.error("Falta DATABASE_URL en .env");
  process.exit(1);
}

const sql = postgres(pgConnectionString);

async function main() {
    console.log("Ejecutando ALTER TABLE en la bóveda de pacientes...");
    try {
        await sql`ALTER TABLE cq_patient_pii ADD COLUMN IF NOT EXISTS direccion TEXT`;
        console.log("✅ Columna 'direccion' agregada exitosamente a 'cq_patient_pii'.");
    } catch (e) {
        console.error("Error al alterar la tabla:", e);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

main();
