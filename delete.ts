import { db } from './src/db/index.ts';
import { cqSurgeries, cqPatients } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
    const patients = await db.select().from(cqPatients).where(eq(cqPatients.dni, '09791569'));
    if (patients.length === 0) { console.log('No patient found'); process.exit(0); }
    console.log('Patient ID:', patients[0].id);
    const surgeries = await db.select().from(cqSurgeries).where(eq(cqSurgeries.patientId, patients[0].id));
    console.log('Surgeries to delete:', surgeries.length);
    if(surgeries.length > 0) {
        const res = await db.delete(cqSurgeries).where(eq(cqSurgeries.patientId, patients[0].id)).returning();
        console.log('Deleted surgeries IDs:', res.map(r => r.id));
    }
    process.exit(0);
}
main().catch(console.error);
