import { db } from "./src/db";
import { cqSurgeries, cqSurgeryTeam, cqSurgeryDiagnoses, cqSurgeryProcedures } from "./src/db/schema";

async function nukeSurgeries() {
    console.log("Iniciando purga total de cirugías como Super Admin...");
    
    try {
        // Borramos primero las tablas dependientes (hijas) por seguridad referencial
        await db.delete(cqSurgeryTeam);
        await db.delete(cqSurgeryDiagnoses);
        await db.delete(cqSurgeryProcedures);
        
        // Procedemos a eliminar la tabla maestra de cirugías
        await db.delete(cqSurgeries);
        
        console.log("✅ Todas las programaciones han sido eliminadas exitosamente de la bóveda BackCQ.");
    } catch (error) {
        console.error("❌ Error durante la purga:", error);
    }
    
    process.exit(0);
}

nukeSurgeries();
