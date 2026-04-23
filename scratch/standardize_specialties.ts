import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
import { cqSpecialties, cqSurgeries } from '../src/db/schema';
import { eq, inArray } from 'drizzle-orm';

async function standardizeSpecialties() {
  const DATABASE_URL = "postgresql://jvp_user:V3l4p4r3d3s@localhost:6432/ogess";
  const client = postgres(DATABASE_URL, { prepare: false });
  const db = drizzle(client, { schema });

  // Mapeo de nombres incorrectos/abreviados a nombres oficiales
  const mapping = [
    { from: 'CX. PEDIÁTRICA', to: 'CIRUGIA PEDIATRICA' },
    { from: 'CX ONCOLOGICA', to: 'CIRUGIA ONCOLOGICA' },
    { from: 'OFTANMOLOGIA', to: 'OFTALMOLOGIA' },
    { from: 'GINECO-OBTETRICIA', to: 'GINECOLOGIA Y OBSTETRICIA' },
    { from: 'CIRUGIA PLASTICA', to: 'CIRUGIA PLASTICA Y QUEMADOS' },
    { from: 'OTORRINO', to: 'OTORRINOLARINGOLOGIA' },
    { from: 'TRAUMATOLOGÍA', to: 'TRAUMATOLOGIA Y ORTOPEDIA' },
    { from: 'CIRUGÍA', to: 'CIRUGIA GENERAL' },
    { from: 'GASTROLOGIA', to: 'GASTROENTEROLOGIA' },
  ];

  try {
    console.log('Iniciando estandarización de especialidades...');

    for (const item of mapping) {
      // 1. Buscar la especialidad destino (ID oficial)
      const targetSpec = await db.select().from(cqSpecialties).where(eq(cqSpecialties.name, item.to)).limit(1);
      
      if (targetSpec.length > 0) {
        const targetId = targetSpec[0].id;

        // 2. Buscar si existe la especialidad con el nombre "incorrecto"
        const sourceSpec = await db.select().from(cqSpecialties).where(eq(cqSpecialties.name, item.from)).limit(1);

        if (sourceSpec.length > 0) {
          const sourceId = sourceSpec[0].id;
          console.log(`🔄 Homologando "${item.from}" -> "${item.to}"`);

          // 3. Reasignar todas las cirugías que apunten a la especialidad incorrecta
          const updated = await db.update(cqSurgeries)
            .set({ specialtyId: targetId })
            .where(eq(cqSurgeries.specialtyId, sourceId));
          
          console.log(`   - ${updated.length} cirugías actualizadas.`);

          // 4. Desactivar o eliminar la especialidad incorrecta para que no aparezca en combos
          await db.update(cqSpecialties)
            .set({ isActive: false })
            .where(eq(cqSpecialties.id, sourceId));
          
          console.log(`   - Especialidad "${item.from}" marcada como inactiva.`);
        }
      }
    }

    console.log('Estandarización finalizada.');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la estandarización:', error);
    process.exit(1);
  }
}

standardizeSpecialties();
