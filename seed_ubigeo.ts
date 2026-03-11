import { config } from "dotenv";
config({ path: ".env" });

// dynamic imports to ensure env loads first
async function seed() {
    const { db } = await import("./src/db");
    const { cqUbigeo } = await import("./src/db/schema");

    console.log("Fetching original INEI/RENIEC UBIGEO Data...");
    try {
        const res = await fetch("https://raw.githubusercontent.com/jmcastagnetto/ubigeo-peru-aumentado/main/ubigeo_distrito.csv");
        const text = await res.text();

        // Parses lines
        const lines = text.split('\n');
        lines.shift(); // remove header

        console.log(`Ready to insert ${lines.length} rows...`);

        // We'll insert in chunks of 500 to avoid overwhelming the pg instance
        let currentChunk: any[] = [];
        let count = 0;

        for (const line of lines) {
            if (!line.trim()) continue;

            const cols = line.split(',');
            if (cols.length < 16) continue;

            currentChunk.push({
                code: cols[0].trim(),
                departamento: cols[2].trim(),
                provincia: cols[3].trim(),
                distrito: cols[4].trim(),
                superficie: cols[11].trim() || null,
                altitud: cols[13].trim() || null,
                latitud: cols[14].trim() || null,
                longitud: cols[15].trim() || null,
            });

            if (currentChunk.length >= 500) {
                await db.insert(cqUbigeo).values(currentChunk).onConflictDoNothing();
                count += currentChunk.length;
                console.log(`Inserted ${count} rows`);
                currentChunk = [];
            }
        }

        // insert remaining
        if (currentChunk.length > 0) {
            await db.insert(cqUbigeo).values(currentChunk).onConflictDoNothing();
            count += currentChunk.length;
            console.log(`Inserted ${count} rows`);
        }

        console.log("✅ UBIGEO Seeded successfully from INEI data.");
    } catch (error) {
        console.error("❌ Seeding UBIGEO failed:", error);
    }
}

seed().catch(console.error);
