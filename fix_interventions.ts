import { config } from 'dotenv';
config({ path: '.env' });
import { db } from './src/db/index.ts';
import { cqInterventionTypes } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log('Fixing code for LEGRADO UTERINO...');
    await db.update(cqInterventionTypes)
      .set({ code: 'TINT-0173' })
      .where(eq(cqInterventionTypes.name, 'LEGRADO UTERINO'));

    console.log('Inserting ASPIRACIÓN MANUAL ENDOUTERINA...');
    await db.insert(cqInterventionTypes)
      .values({
        code: 'TINT-0174',
        name: 'ASPIRACIÓN MANUAL ENDOUTERINA'
      })
      .onConflictDoNothing();
      
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

main();
