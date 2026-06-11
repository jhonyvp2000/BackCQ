import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("=========================================================");
    console.log("CONFIGURANDO ÍNDICES DE TRIGRAMAS PARA PROCEDIMIENTOS");
    console.log("=========================================================");

    try {
        console.log("[*] Creando índice GIN para la columna 'name' de cq_procedures...");
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cq_procedures_name_trgm ON cq_procedures USING gin (name gin_trgm_ops)`);
        console.log("[✔] Índice GIN en 'name' creado con éxito.");

        console.log("[*] Creando índice GIN para la columna 'code' de cq_procedures...");
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cq_procedures_code_trgm ON cq_procedures USING gin (code gin_trgm_ops)`);
        console.log("[✔] Índice GIN en 'code' creado con éxito.");

        console.log("\n=========================================================");
        console.log("[✔] Todos los índices de trigramas de procedimientos configurados.");
        console.log("=========================================================");
    } catch (e) {
        console.error("Error durante la configuración de índices:", e);
    } finally {
        process.exit(0);
    }
}

main();
