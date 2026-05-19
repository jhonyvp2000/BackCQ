import { config } from 'dotenv';
config();

import { db } from './src/db';
import { cqPatients, cqPatientPii } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('Buscando al paciente con DNI 90273501...');
    const pii = await db.select().from(cqPatientPii).where(eq(cqPatientPii.dni, '90273501'));
    if (pii.length === 0) {
        console.log('No existe en la base de datos.');
        return;
    }
    const pId = pii[0].patientId;
    console.log(`Paciente encontrado (ID interno: ${pId}). Borrando de cq_patient_pii...`);
    await db.delete(cqPatientPii).where(eq(cqPatientPii.dni, '90273501'));
    
    console.log('Borrando de cq_patients...');
    try {
        await db.delete(cqPatients).where(eq(cqPatients.id, pId));
        console.log('Borrado exitoso completo.');
    } catch (e: any) {
        console.error('No se pudo borrar de cq_patients (puede que tenga cirugías asociadas):', e.message);
    }
    process.exit(0);
}

main().catch(console.error);
