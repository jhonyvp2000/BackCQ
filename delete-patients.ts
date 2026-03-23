import { db } from "./src/db";
import { cqPatientPii, cqPatients } from "./src/db/schema";
import "dotenv/config";

async function nukePatients() {
    console.log("Iniciando purga total de la bóveda de Pacientes...");
    
    try {
        // Borrar capa PII primero (Identity Vault)
        await db.delete(cqPatientPii);
        
        // Borrar capa Demográfica base (UIDs)
        await db.delete(cqPatients);
        
        console.log("✅ Toda la información Personal y Demográfica de los pacientes ha sido erradicada.");
    } catch (error) {
        console.error("❌ Error durante la eliminación:", error);
    }
    
    process.exit(0);
}

nukePatients();
