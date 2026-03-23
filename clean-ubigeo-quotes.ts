import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './src/db/schema';
import { sql } from 'drizzle-orm';

dotenv.config();

const pgConnectionString = process.env.DATABASE_URL;

if (!pgConnectionString) {
  console.error("Falta DATABASE_URL en .env");
  process.exit(1);
}

const client = postgres(pgConnectionString);

async function main() {
    console.log("Conectando a PostgreSQL para limpieza de Ubigeos...");
    try {
        const rowsToUpdate = await client`
            SELECT code, departamento, provincia, distrito 
            FROM cq_ubigeo 
            WHERE departamento LIKE '%"%' 
               OR provincia LIKE '%"%' 
               OR distrito LIKE '%"%'
        `;

        if (rowsToUpdate.length === 0) {
            console.log("✅ No se encontraron registros con comillas.");
            return;
        }

        console.log(`Encontrados ${rowsToUpdate.length} registros con comillas para corregir.`);

        let updated = 0;
        for (const row of rowsToUpdate) {
            const cleanDpto = row.departamento?.replace(/"/g, '');
            const cleanProv = row.provincia?.replace(/"/g, '');
            const cleanDist = row.distrito?.replace(/"/g, '');

            await client`
                UPDATE cq_ubigeo 
                SET departamento = ${cleanDpto},
                    provincia = ${cleanProv},
                    distrito = ${cleanDist}
                WHERE code = ${row.code}
            `;
            console.log(`[${row.code}] Limpiado: ${cleanDpto} / ${cleanProv} / ${cleanDist}`);
            updated++;
        }

        console.log(`\n🎉 Operación finalizada. ${updated} registros corregidos exitosamente.`);

    } catch (e) {
        console.error("Error al limpiar registros:", e);
    } finally {
        await client.end();
        process.exit(0);
    }
}

main();
