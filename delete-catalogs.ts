import { db } from "./src/db";
import { cqDiagnoses, cqProcedures } from "./src/db/schema";
import "dotenv/config";

async function nukeCatalogs() {
    console.log("Iniciando purga total de Catálogos (Diagnósticos y Procedimientos)...");
    
    try {
        await db.delete(cqDiagnoses);
        await db.delete(cqProcedures);
        
        console.log("✅ Todos los Diagnósticos y Procedimientos han sido arrasados de la bóveda local exitosamente.");
    } catch (error) {
        console.error("❌ Error durante la purga de catálogos:", error);
    }
    
    process.exit(0);
}

nukeCatalogs();
