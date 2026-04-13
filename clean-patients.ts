import "dotenv/config";
import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function runCleanup() {
  console.log("Cleaning database anomalies...");
  try {
    // 1. Recreate cq_patients with correct columns since it was corrupted
    await db.execute(sql`DROP TABLE IF EXISTS "cq_patients" CASCADE;`);
    
    await db.execute(sql`
      CREATE TABLE "cq_patients"(
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "dni" varchar(8) UNIQUE,
      "carnet_extranjeria" varchar(20) UNIQUE,
      "nombres" text NOT NULL,
      "apellidos" text NOT NULL,
      "fecha_nacimiento" timestamp,
      "sexo" varchar(20),
      "historia_clinica" varchar(50) UNIQUE,
      "ubigeo" varchar(6),
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // 2. Insert test data
    await db.execute(sql`
      INSERT INTO "cq_patients"("dni", "nombres", "apellidos", "fecha_nacimiento", "sexo", "historia_clinica", "ubigeo")
      VALUES
        ('09791569', 'CARLOS ALBERTO', 'PÉREZ MENDOZA', '1980-05-15 00:00:00', 'Masculino', 'HC-100234', '150101'),
        ('45678912', 'MARÍA FERNANDA', 'GÓMEZ RUIZ', '1992-11-20 00:00:00', 'Femenino', 'HC-200542', '150132'),
        ('78912345', 'JUAN DANIEL', 'LÓPEZ SANCHEZ', '2000-01-10 00:00:00', 'Masculino', 'HC-300121', '040101')
      ON CONFLICT("dni") DO NOTHING;
    `);

    // 3. Delete anomalous users from usersTable
    const deletedUsers = await db.execute(sql`
      DELETE FROM "users"
      WHERE 
        "name" IS NULL 
        OR TRIM("name") = '' 
        OR UPPER("name") LIKE '%NO IDENTIFICADO%'
        OR UPPER("name") LIKE '%ANOMAL%'
        OR UPPER("lastname") LIKE '%NO IDENTIFICADO%'
        OR "lastname" IS NULL 
        OR TRIM("lastname") = ''
        OR "dni" IS NULL 
        OR TRIM("dni") = ''
      RETURNING "dni";
    `);
    console.log(`Deleted ${deletedUsers.length} anomalous records from "users" table.`);

    // Wait, let's extract the deleted DNIs to wipe their surgeries.
    const badDnis = deletedUsers.map(r => r.dni).filter(d => !!d);

    // 4. Delete orphaned or anomalous surgeries
    // If the patient_id is not identifiable, we delete the surgery.
    let deletedSurgeries = 0;
    
    const r1 = await db.execute(sql`
       DELETE FROM "cq_surgeries"
       WHERE "patient_id" IS NULL
       OR TRIM("patient_id") = ''
       OR UPPER("patient_id") LIKE '%NO IDENTIFICADO%';
    `);
    deletedSurgeries += r1.length;

    if (badDnis.length > 0) {
      // Drizzle SQL binding for arrays is tricky, we can do multiple calls or string interpolation securely here 
      // since badDnis are just strings we fetched locally. Let's do a fast IN query.
      const dnisListStr = badDnis.map(d => `'${d}'`).join(',');
      const r2 = await db.execute(sql.raw(`
        DELETE FROM "cq_surgeries"
        WHERE "patient_id" IN (${dnisListStr});
      `));
      deletedSurgeries += r2.length;
    }
    
    console.log(`Deleted ${deletedSurgeries} anomalous or orphaned surgeries.`);

    console.log("Cleanup and fix successful!");
    process.exit(0);
  } catch (err) {
    console.error("Error during execution:", err);
    process.exit(1);
  }
}

runCleanup();
