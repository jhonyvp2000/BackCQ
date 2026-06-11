import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("=========================================================");
    console.log("CONFIGURANDO EXTENSIÓN Y ÍNDICES DE TRIGRAMAS EN POSTGRESQL");
    console.log("=========================================================");

    try {
        console.log("[*] Creando extensión pg_trgm...");
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
        console.log("[✔] Extensión pg_trgm habilitada con éxito.");

        console.log("[*] Creando índice GIN para la columna 'name'...");
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cq_diagnoses_name_trgm ON cq_diagnoses USING gin (name gin_trgm_ops)`);
        console.log("[✔] Índice GIN en 'name' creado con éxito.");

        console.log("[*] Creando índice GIN para la columna 'code'...");
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cq_diagnoses_code_trgm ON cq_diagnoses USING gin (code gin_trgm_ops)`);
        console.log("[✔] Índice GIN en 'code' creado con éxito.");

        console.log("\n=========================================================");
        console.log("[✔] Todos los índices de trigramas configurados correctamente.");
        console.log("=========================================================");
    } catch (e) {
        console.error("Error durante la configuración de índices:", e);
    } finally {
        process.exit(0);
    }
}

main();
