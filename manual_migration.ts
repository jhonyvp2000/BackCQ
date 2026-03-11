import "dotenv/config";
import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS cq_procedures (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(20) UNIQUE,
                name TEXT NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);
        console.log("procedures created");

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS cq_surgery_procedures (
                surgery_id UUID NOT NULL REFERENCES cq_surgeries(id) ON DELETE CASCADE,
                procedure_id UUID NOT NULL REFERENCES cq_procedures(id) ON DELETE RESTRICT,
                PRIMARY KEY (surgery_id, procedure_id)
            );
        `);
        console.log("junction table created");

        // Seed some standard procedures
        await db.execute(sql`
            INSERT INTO cq_procedures (code, name) VALUES 
            ('44970', 'Apendicectomía laparoscópica'),
            ('47562', 'Colecistectomía laparoscópica'),
            ('49505', 'Reparación de hernia inguinal inicial'),
            ('59514', 'Cesárea (parto abdominal)'),
            ('19120', 'Excisión o destrucción, lesión de mama abierta'),
            ('61312', 'Craneotomía o craniectomía por evacuación de hematoma'),
            ('52352', 'Cistouretroscopia con litotricia de uréter'),
            ('63030', 'Laminectomía con descompresión de raíz nerviosa'),
            ('42440', 'Escisión de glándula submandibular'),
            ('40700', 'Reparación plástica de labio leporino')
            ON CONFLICT (code) DO NOTHING;
        `);
        console.log("seeded procedures");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
