import * as xlsx from 'xlsx';
import { db } from './src/db';
import { usersTable, staffProfiles } from './src/db/schema';
import { eq } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';

// "TECNICO CIRCULANTE" id from db
const TECNICO_CIRCULANTE_ID = '1ea2eba1-2468-48d6-a199-fe775a7d40b2';

function normalize(text: string): string[] {
    if (!text) return [];
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s]/g, " ") // Replace non alphanumeric with space
        .split(/\s+/)
        .filter(w => w.length > 2); // Ignore very short words like 'de', 'la'
}

function calculateMatchScore(excelTokens: string[], dbTokens: string[]): number {
    const intersection = excelTokens.filter(t => dbTokens.includes(t));
    const score1 = intersection.length / excelTokens.length;
    const score2 = intersection.length / dbTokens.length;
    return Math.max(score1, score2);
}

async function main() {
    console.log("Reading DB...");
    const allUsers = await db.select({
        id: usersTable.id,
        firstName: usersTable.name,
        lastName: usersTable.lastname,
    }).from(usersTable)
      .innerJoin(staffProfiles, eq(usersTable.id, staffProfiles.userId));

    console.log(`Loaded ${allUsers.length} staff users from DB.`);

    const dbUsersMapped = allUsers.map(u => ({
        ...u,
        tokens: normalize(`${u.firstName} ${u.lastName}`)
    }));

    const excelPath = path.join(process.cwd(), 'no_copiar _a_produccion', 'Tecnicos.xlsx');
    const outPath = path.join(process.cwd(), 'no_copiar _a_produccion', 'Tecnicos_No_Encontrados.xlsx');

    const wb = xlsx.readFile(excelPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: any[] = xlsx.utils.sheet_to_json(ws);

    let updatedCount = 0;
    const notFound: any[] = [];

    for (const row of data) {
        const fullName = row['APELLIDOS Y NOMBRES'] || row['Apellidos y nombres'];
        if (!fullName) continue;

        const excelTokens = normalize(fullName);
        if (excelTokens.length === 0) continue;

        // Find matches
        let bestScore = 0;
        let bestMatches: typeof dbUsersMapped = [];

        for (const dbUser of dbUsersMapped) {
            const score = calculateMatchScore(excelTokens, dbUser.tokens);
            if (score > bestScore) {
                bestScore = score;
                bestMatches = [dbUser];
            } else if (score === bestScore && score > 0) {
                bestMatches.push(dbUser);
            }
        }

        // We consider a good match if score > 0.74
        if (bestScore > 0.74) {
            if (bestMatches.length === 1) {
                const match = bestMatches[0];
                console.log(`[MATCH] Excel: "${fullName}" -> DB: "${match.firstName} ${match.lastName}" (Score: ${bestScore.toFixed(2)})`);
                
                // Update in DB
                await db.update(staffProfiles)
                    .set({ professionId: TECNICO_CIRCULANTE_ID })
                    .where(eq(staffProfiles.userId, match.id));
                updatedCount++;
            } else {
                console.log(`[AMBIGUOUS] Excel: "${fullName}" matched ${bestMatches.length} users with score ${bestScore.toFixed(2)}.`);
                notFound.push(row);
            }
        } else {
            console.log(`[NOT FOUND] Excel: "${fullName}" (Best score: ${bestScore.toFixed(2)})`);
            notFound.push(row);
        }
    }

    console.log(`\nResults:`);
    console.log(`- Total processed: ${data.length}`);
    console.log(`- Successfully updated: ${updatedCount}`);
    console.log(`- Not found / Ambiguous: ${notFound.length}`);

    if (notFound.length > 0) {
        const newWs = xlsx.utils.json_to_sheet(notFound);
        const newWb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWb, newWs, "No Encontrados");
        xlsx.writeFile(newWb, outPath);
        console.log(`Saved not found rows to: ${outPath}`);
    }
    
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
