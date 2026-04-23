import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
import { cqSpecialties } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function seedSpecialties() {
  const DATABASE_URL = "postgresql://jvp_user:V3l4p4r3d3s@localhost:6432/ogess";
  const client = postgres(DATABASE_URL, { prepare: false });
  const db = drizzle(client, { schema });

  const newSpecialties = [
    { name: 'CARDIOLOGIA', description: 'Especialidad de Cardiología' },
    { name: 'CIRUGIA DE CABEZA Y CUELLO', description: 'Especialidad de Cirugía de Cabeza y Cuello' },
    { name: 'CIRUGIA LAPAROSCOPICA', description: 'Técnica de Cirugía Laparoscópica' },
    { name: 'GASTROENTEROLOGIA', description: 'Especialidad de Gastroenterología' },
    { name: 'NEUMOLOGIA', description: 'Especialidad de Neumología' },
    { name: 'ODONTOLOGIA', description: 'Especialidad de Odontología' },
    { name: 'HEMATOLOGIA', description: 'Especialidad de Hematología' },
  ];

  try {
    console.log('Iniciando inserción de nuevas especialidades...');

    for (const spec of newSpecialties) {
      // Verificar si ya existe para evitar duplicados por nombre
      const existing = await db.select().from(cqSpecialties).where(eq(cqSpecialties.name, spec.name)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(cqSpecialties).values({
          name: spec.name,
          description: spec.description,
          isActive: true,
        });
        console.log(`✅ Insertada: ${spec.name}`);
      } else {
        console.log(`ℹ️ Ya existe: ${spec.name}`);
      }
    }

    console.log('Proceso de seed finalizado con éxito.');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

seedSpecialties();
