import * as xlsx from 'xlsx';
import { db } from './src/db';
import { usersTable, staffProfiles } from './src/db/schema';
import { eq } from 'drizzle-orm';
import path from 'path';

// "ENFERMERO" id from db
const ENFERMERO_ID = 'af730590-d5c8-44d1-9da3-9a2b716a165f';

async function main() {
    console.log("Reading DB for generic ENFERMERO staff...");
    
    // Find all users with exact professionId = ENFERMERO_ID
    const targetStaff = await db.select({
        userId: staffProfiles.userId,
        dni: usersTable.dni,
        name: usersTable.name,
        lastname: usersTable.lastname,
    }).from(staffProfiles)
      .innerJoin(usersTable, eq(staffProfiles.userId, usersTable.id))
      .where(eq(staffProfiles.professionId, ENFERMERO_ID));

    console.log(`Found ${targetStaff.length} profiles with generic 'ENFERMERO' profession.`);

    let deletedCount = 0;
    const failedToDelete: any[] = [];

    for (const staff of targetStaff) {
        try {
            // Attempt to delete from staff_profiles
            await db.delete(staffProfiles)
                .where(eq(staffProfiles.userId, staff.userId));
            
            deletedCount++;
            console.log(`[DELETED] ${staff.name} ${staff.lastname} (DNI: ${staff.dni})`);
        } catch (error: any) {
            // If it fails, likely due to a foreign key constraint
            console.log(`[FAILED] Could not delete ${staff.name} ${staff.lastname}. Reason: ${error.message}`);
            failedToDelete.push({
                "DNI": staff.dni,
                "Apellidos": staff.lastname,
                "Nombres": staff.name,
                "Error Técnico": error.message
            });
        }
    }

    console.log(`\nResults:`);
    console.log(`- Total target profiles: ${targetStaff.length}`);
    console.log(`- Successfully deleted: ${deletedCount}`);
    console.log(`- Failed (Referential Integrity): ${failedToDelete.length}`);

    if (failedToDelete.length > 0) {
        const outPath = path.join(process.cwd(), 'no_copiar _a_produccion', 'Enfermeros_Con_Dependencias.xlsx');
        const newWs = xlsx.utils.json_to_sheet(failedToDelete);
        const newWb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWb, newWs, "Dependencias");
        xlsx.writeFile(newWb, outPath);
        console.log(`Saved failed deletions to: ${outPath}`);
    }
    
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
