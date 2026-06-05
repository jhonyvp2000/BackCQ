import "dotenv/config";
import { db } from "../src/db";
import { cqPatients, cqPatientPii } from "../src/db/schema";
import { eq, and, or, isNull, sql } from "drizzle-orm";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log("=== STARTING PATIENT DATA BACKFILL ===");

    // Parse --limit argument
    let limit: number | null = null;
    const limitIdx = process.argv.indexOf("--limit");
    if (limitIdx !== -1 && process.argv[limitIdx + 1]) {
        limit = parseInt(process.argv[limitIdx + 1], 10);
    }

    const apiUrl = process.env.API_NETHOS_URL || "http://192.168.41.25:3010";
    console.log(`Using API NetHos URL: ${apiUrl}`);

    // Query patients with 8-digit DNI missing ubigeo or address
    const candidates = await db.select({
        patientId: cqPatients.id,
        dni: cqPatientPii.dni,
        nombres: cqPatientPii.nombres,
        apellidos: cqPatientPii.apellidos,
        currentUbigeo: cqPatients.ubigeo,
        currentDireccion: cqPatientPii.direccion
    })
    .from(cqPatients)
    .innerJoin(cqPatientPii, eq(cqPatients.id, cqPatientPii.patientId))
    .where(
        and(
            sql`length(${cqPatientPii.dni}) = 8`,
            or(
                isNull(cqPatients.ubigeo),
                isNull(cqPatientPii.direccion),
                sql`${cqPatientPii.direccion} = ''`
            )
        )
    );

    console.log(`Found total candidates missing data: ${candidates.length}`);
    const targets = limit ? candidates.slice(0, limit) : candidates;
    console.log(`Processing ${targets.length} targets (limit: ${limit ?? "unlimited"})...\n`);

    let updatedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const prefix = `[${i + 1}/${targets.length}] DNI ${target.dni} (${target.nombres} ${target.apellidos}):`;

        try {
            const response = await fetch(`${apiUrl}/api/pacientes/search?documento=${target.dni}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) {
                console.error(`${prefix} API returned status ${response.status}`);
                errorCount++;
                continue;
            }

            const data = await response.json();
            let externalPatientData = null;
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                externalPatientData = data.data[0];
            } else if (data.data && !Array.isArray(data.data) && data.data.nombres) {
                externalPatientData = data.data;
            }

            if (!externalPatientData || (!externalPatientData.nombres && !externalPatientData.apellidoPaterno)) {
                console.log(`${prefix} NOT FOUND in NetHos API`);
                notFoundCount++;
                continue;
            }

            const rawUbi = externalPatientData.codigoInei || externalPatientData.ubigeoinei;
            const ubi = rawUbi ? rawUbi.toString().trim() : null;
            const dir = externalPatientData.direccion ? externalPatientData.direccion.toString().trim() : null;

            if (ubi || dir) {
                if (ubi) {
                    await db.update(cqPatients).set({ ubigeo: ubi, updatedAt: new Date() }).where(eq(cqPatients.id, target.patientId));
                }
                if (dir) {
                    await db.update(cqPatientPii).set({ direccion: dir }).where(eq(cqPatientPii.patientId, target.patientId));
                }
                console.log(`${prefix} UPDATED successfully (Ubigeo: ${ubi || "N/A"}, Direccion: ${dir || "N/A"})`);
                updatedCount++;
            } else {
                console.log(`${prefix} Found in API but both ubigeo and address are empty`);
                notFoundCount++;
            }

        } catch (e) {
            console.error(`${prefix} Error during fetch/db update:`, e);
            errorCount++;
        }

        // Wait 100ms to throttle API requests
        await sleep(100);
    }

    console.log("\n=== BACKFILL SUMMARY ===");
    console.log(`Total processed: ${targets.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Not found in API: ${notFoundCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log("========================");

    process.exit(0);
}

main().catch((err) => {
    console.error("Critical error in main backfill:", err);
    process.exit(1);
});
