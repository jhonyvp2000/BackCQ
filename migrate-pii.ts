import "dotenv/config";
import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Starting Migration PII...");

    try {
        // 1. Create table
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS cq_patient_pii (
                patient_id UUID PRIMARY KEY REFERENCES cq_patients(id) ON DELETE CASCADE,
                dni VARCHAR(8),
                carnet_extranjeria VARCHAR(20),
                nombres TEXT NOT NULL,
                apellidos TEXT NOT NULL,
                historia_clinica VARCHAR(50),
                UNIQUE(dni), UNIQUE(carnet_extranjeria), UNIQUE(historia_clinica)
            );
        `);
        console.log("Created cq_patient_pii table");

        // 2. Add foreign key index to cq_surgeries for performance
        try {
            await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cq_surgeries_patient_id ON cq_surgeries(patient_id);`);
            // Create a general index on PII table for querying
            await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_cq_patient_pii_dni ON cq_patient_pii(dni);`);
        } catch (e) { }

        // 3. Migrate existing patients PII
        const cols = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'cq_patients' AND column_name = 'dni';`);
        if (cols.length > 0) {
            await db.execute(sql`
                INSERT INTO cq_patient_pii (patient_id, dni, carnet_extranjeria, nombres, apellidos, historia_clinica)
                SELECT id, dni, carnet_extranjeria, nombres, apellidos, historia_clinica
                FROM cq_patients
                ON CONFLICT (patient_id) DO NOTHING;
            `);
            console.log("Migrated data to cq_patient_pii.");
        }

        // 4. Fix cq_surgeries
        const isText = await db.execute(sql`SELECT data_type FROM information_schema.columns WHERE table_name = 'cq_surgeries' AND column_name = 'patient_id'`);
        if (isText[0]?.data_type === 'text' || isText[0]?.data_type === 'character varying') {
            const surgeries = await db.execute(sql`SELECT id, patient_id FROM cq_surgeries`);
            for (const s of surgeries) {
                const patientIdent = s.patient_id;
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientIdent as string);
                if (!isUUID && patientIdent) {
                    const pii = await db.execute(sql`SELECT patient_id FROM cq_patient_pii WHERE dni = ${patientIdent} OR historia_clinica = ${patientIdent}`);
                    let realPatientId;
                    if (pii.length > 0) {
                        realPatientId = pii[0].patient_id;
                    } else {
                        // Pass dummy values to bypass NOT NULL constraint before dropping columns later
                        const cols = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'cq_patients' AND column_name = 'nombres';`);
                        let newPat;
                        if (cols.length > 0) {
                            newPat = await db.execute(sql`INSERT INTO cq_patients (id, nombres, apellidos) VALUES (gen_random_uuid(), 'Desconocido', 'Desconocido') RETURNING id`);
                        } else {
                            newPat = await db.execute(sql`INSERT INTO cq_patients (id) VALUES (gen_random_uuid()) RETURNING id`);
                        }
                        realPatientId = newPat[0].id;
                        await db.execute(sql`INSERT INTO cq_patient_pii (patient_id, dni, nombres, apellidos) VALUES (${realPatientId}, ${patientIdent}, 'Desconocido', 'Desconocido')`);
                    }
                    await db.execute(sql`UPDATE cq_surgeries SET patient_id = ${realPatientId} WHERE id = ${s.id}`);
                }
            }
            console.log("Surgeries point to UUID now.");
        }

        // 5. Alter columns
        try {
            await db.execute(sql`
                ALTER TABLE cq_surgeries ALTER COLUMN patient_id TYPE UUID USING (patient_id::uuid);
                ALTER TABLE cq_surgeries DROP CONSTRAINT IF EXISTS cq_surgeries_patient_id_fkey;
                ALTER TABLE cq_surgeries ADD CONSTRAINT cq_surgeries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES cq_patients(id) ON DELETE RESTRICT;
            `);
            console.log("cq_surgeries patient_id is now UUID with foreign key.");
        } catch (e: any) {
            console.log("Could not alter cq_surgeries column", e.message);
        }

        try {
            await db.execute(sql`
                ALTER TABLE cq_patients
                DROP COLUMN IF EXISTS dni CASCADE,
                DROP COLUMN IF EXISTS carnet_extranjeria CASCADE,
                DROP COLUMN IF EXISTS nombres CASCADE,
                DROP COLUMN IF EXISTS apellidos CASCADE,
                DROP COLUMN IF EXISTS historia_clinica CASCADE;
            `);
            console.log("cq_patients PII columns dropped.");
        } catch (e: any) {
            console.log("Could not drop PII columns from cq_patients", e.message);
        }

        // 6. RLS 
        try {
            await db.execute(sql`
                ALTER TABLE cq_patient_pii ENABLE ROW LEVEL SECURITY;
                DROP POLICY IF EXISTS allow_all_backend ON cq_patient_pii;
                CREATE POLICY allow_all_backend ON cq_patient_pii FOR ALL USING (true);
            `);
            console.log("RLS Enabled on cq_patient_pii.");
        } catch (e: any) {
            console.log("Could not enable RLS", e.message);
        }

    } catch (err) {
        console.error(err);
    }
    console.log("Done.");
    process.exit(0);
}

main();
