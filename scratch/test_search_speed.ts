import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/db";
import { cqDiagnoses } from "../src/db/schema";
import { or, ilike } from "drizzle-orm";

async function runTest(term: string) {
    const start = performance.now();
    const results = await db.select()
        .from(cqDiagnoses)
        .where(
            or(
                ilike(cqDiagnoses.code, `%${term}%`),
                ilike(cqDiagnoses.name, `%${term}%`)
            )
        )
        .limit(20);
    const end = performance.now();
    console.log(`Búsqueda de "${term}":`);
    console.log(`  - Tiempo de ejecución: ${(end - start).toFixed(2)} ms`);
    console.log(`  - Resultados obtenidos: ${results.length}`);
    if (results.length > 0) {
        console.log(`  - Primer resultado: [${results[0].code}] ${results[0].name}`);
    }
    console.log("---------------------------------------------------------");
}

async function main() {
    console.log("=========================================================");
    console.log("PRUEBA DE RENDIMIENTO: BÚSQUEDA CON TRIGRAMAS (13,000 REGISTROS)");
    console.log("=========================================================");

    try {
        await runTest("apendicitis");
        await runTest("fractura");
        await runTest("tobillo");
        await runTest("cesarea");
        await runTest("K35");
        await runTest("absceso");
    } catch (e) {
        console.error("Error durante las pruebas:", e);
    } finally {
        process.exit(0);
    }
}

main();
