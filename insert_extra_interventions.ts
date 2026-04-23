import { config } from 'dotenv';
config({ path: '.env' });
import { db } from './src/db';
import { cqInterventionTypes } from './src/db/schema';
import { desc } from 'drizzle-orm';

async function main() {
  console.log('Fetching latest intervention code...');
  const latest = await db.select({ code: cqInterventionTypes.code })
    .from(cqInterventionTypes)
    .orderBy(desc(cqInterventionTypes.code))
    .limit(1);
  
  let codeCounter = 1;
  if (latest.length > 0 && latest[0].code) {
    const match = latest[0].code.match(/TINT-(\d+)/);
    if (match) {
      codeCounter = parseInt(match[1], 10) + 1;
    }
  }
  
  const toInsert = [
    { name: "LEGRADO UTERINO" },
    { name: "ASPIRACIÓN MANUAL ENDOUTERINA" }
  ];

  const valuesToInsert = toInsert.map(item => {
    const codeStr = codeCounter.toString().padStart(4, '0');
    codeCounter++;
    return {
      code: `TINT-${codeStr}`,
      name: item.name
    };
  });

  console.log('Inserting...', valuesToInsert);
  
  try {
    await db.insert(cqInterventionTypes).values(valuesToInsert).onConflictDoNothing();
    console.log('Done inserting extra interventions!');
  } catch (err) {
    console.error('Error:', err);
  }
  
  process.exit(0);
}

main();
