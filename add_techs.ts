import { db } from "./src/db/index";
import { professions } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    const newProfs = [
        { name: 'TECNICO INSTRUMENTISTA', staffCategory: 'ASISTENCIAL' },
        { name: 'TECNICO CIRCULANTE', staffCategory: 'ASISTENCIAL' }
    ];

    for (const p of newProfs) {
        const existing = await db.select().from(professions).where(eq(professions.name, p.name));
        if (existing.length === 0) {
            await db.insert(professions).values(p);
            console.log(`Insertado: ${p.name}`);
        } else {
            console.log(`Ya existía: ${p.name}`);
        }
    }
    process.exit(0);
}

main().catch(console.error);
