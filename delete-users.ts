import { db } from "./src/db";
import { usersTable } from "./src/db/schema";
import { not, eq } from "drizzle-orm";

async function purgeUsersContext() {
    console.log("Iniciando purga selectiva de usuarios...");
    
    try {
        const result = await db.delete(usersTable).where(not(eq(usersTable.dni, '09791569'))).returning({ dni: usersTable.dni });
        console.log(`✅ Operación exitosa. Se eliminaron ${result.length} usuarios.`);
        process.exit(0);
    } catch (e) {
        console.error("❌ Error durante la eliminación:", e);
        process.exit(1);
    }
}

purgeUsersContext();
