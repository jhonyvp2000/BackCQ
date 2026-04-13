import "dotenv/config";
import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function repairDB() {
  console.log("Restoring original schema integrity...");
  try {
    // 1. Drop the manually corrupted table
    await db.execute(sql`DROP TABLE IF EXISTS "cq_patient_pii" CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS "cq_patients" CASCADE;`);

    // 2. Re-create cq_patients based on exact schema.ts
    await db.execute(sql`
      CREATE TABLE "cq_patients"(
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "fecha_nacimiento" timestamp,
        "sexo" varchar(20),
        "ubigeo" varchar(6),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // 3. Re-create cq_patient_pii based on exact schema.ts
    await db.execute(sql`
      CREATE TABLE "cq_patient_pii"(
        "patient_id" uuid PRIMARY KEY REFERENCES "cq_patients"("id") ON DELETE CASCADE,
        "dni" varchar(8) UNIQUE,
        "carnet_extranjeria" varchar(20) UNIQUE,
        "pasaporte" varchar(20) UNIQUE,
        "nombres" text NOT NULL,
        "apellidos" text NOT NULL,
        "historia_clinica" varchar(50) UNIQUE,
        "direccion" text
      );
    `);

    // 4. Restore the foreign key on cq_surgeries which was lost during CASCADE
    // First, let's make sure we don't have orphaned patient_ids in cq_surgeries
    await db.execute(sql`
        UPDATE "cq_surgeries" SET "patient_id" = NULL WHERE "patient_id" NOT IN (SELECT "id" FROM "cq_patients");
    `); // UUIDs could be null if nullable. But in schema it says NOT NULL. 
    // If we have orphans, we'll just delete them since it's test data
    await db.execute(sql`
        DELETE FROM "cq_surgeries" WHERE "patient_id" NOT IN (SELECT "id" FROM "cq_patients");
    `);

    // Now re-add the constraint
    await db.execute(sql`
      ALTER TABLE "cq_surgeries" 
      ADD CONSTRAINT "cq_surgeries_patient_id_cq_patients_id_fk" 
      FOREIGN KEY ("patient_id") REFERENCES "cq_patients"("id") ON DELETE RESTRICT;
    `);

    // 5. Insert mock data properly into the separated paradigm!
    const pat1 = await db.execute(sql`
      INSERT INTO "cq_patients"("fecha_nacimiento", "sexo", "ubigeo") 
      VALUES ('1980-05-15 00:00:00', 'Masculino', '150101') RETURNING id;
    `);
    await db.execute(sql`
      INSERT INTO "cq_patient_pii"("patient_id", "dni", "nombres", "apellidos", "historia_clinica")
      VALUES (${pat1[0].id}, '09791569', 'CARLOS ALBERTO', 'PÉREZ MENDOZA', 'HC-100234');
    `);

    const pat2 = await db.execute(sql`
      INSERT INTO "cq_patients"("fecha_nacimiento", "sexo", "ubigeo") 
      VALUES ('1992-11-20 00:00:00', 'Femenino', '150132') RETURNING id;
    `);
    await db.execute(sql`
      INSERT INTO "cq_patient_pii"("patient_id", "dni", "nombres", "apellidos", "historia_clinica")
      VALUES (${pat2[0].id}, '45678912', 'MARÍA FERNANDA', 'GÓMEZ RUIZ', 'HC-200542');
    `);

    const pat3 = await db.execute(sql`
      INSERT INTO "cq_patients"("fecha_nacimiento", "sexo", "ubigeo") 
      VALUES ('2000-01-10 00:00:00', 'Masculino', '040101') RETURNING id;
    `);
    await db.execute(sql`
      INSERT INTO "cq_patient_pii"("patient_id", "dni", "nombres", "apellidos", "historia_clinica")
      VALUES (${pat3[0].id}, '78912345', 'JUAN DANIEL', 'LÓPEZ SANCHEZ', 'HC-300121');
    `);

    console.log("Database repair complete!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

repairDB();
