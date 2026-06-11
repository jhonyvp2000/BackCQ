import dotenv from "dotenv";
dotenv.config();

import * as XLSX from "xlsx";
import { db } from "../src/db";
import { cqProcedures } from "../src/db/schema";

async function main() {
    console.log("=========================================================");
    console.log("IMPORTACIÓN MASIVA DE PROCEDIMIENTOS CPMS DEL MINSA");
    console.log("=========================================================");

    const filePath = "F:\\JVP\\ANTIGRAVITY\\BackCQ\\no_copiar _a_produccion\\CPMS jvp.xlsx";
    try {
        console.log(`[*] Leyendo catálogo Excel desde: ${filePath}...`);
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets["ANEXO 1"];
        if (!sheet) {
            console.error("[error] No se encontró la hoja 'ANEXO 1' en el archivo Excel.");
            process.exit(1);
        }

        // Convert to array of arrays, including headers
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        console.log(`[✔] Excel cargado. Total de filas (incluyendo cabecera): ${rawData.length}`);

        // Skip header
        const rows = rawData.slice(1);
        const recordsToInsert = [];

        for (const row of rows) {
            const code = row[0] ? String(row[0]).trim() : "";
            const name = row[1] ? String(row[1]).trim().toUpperCase() : "";

            if (!code || !name) continue;

            recordsToInsert.push({
                code: code.substring(0, 20),
                name: name,
                isActive: true,
                isVerifiedMinsa: true
            });
        }

        console.log(`[*] Total de registros válidos para procesar: ${recordsToInsert.length}`);

        // Insert in batches of 500 to avoid parameter limits
        const BATCH_SIZE = 500;
        let insertedCount = 0;

        for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
            const chunk = recordsToInsert.slice(i, i + BATCH_SIZE);
            
            // Insert chunk with ON CONFLICT DO NOTHING
            await db.insert(cqProcedures)
                .values(chunk)
                .onConflictDoNothing({ target: cqProcedures.code });
            
            insertedCount += chunk.length;
            if (insertedCount % 2500 === 0 || insertedCount === recordsToInsert.length) {
                console.log(`    -> Procesados ${insertedCount} / ${recordsToInsert.length} registros...`);
            }
        }

        console.log("\n=========================================================");
        console.log(`[✔] ¡Éxito! Importación completada.`);
        console.log(`[✔] Total de registros procesados: ${insertedCount}`);
        console.log("=========================================================");

    } catch (e) {
        console.error("Error durante el proceso de importación masiva:", e);
    } finally {
        process.exit(0);
    }
}

main();
