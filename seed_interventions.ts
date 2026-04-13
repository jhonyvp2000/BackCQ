import { db } from './src/db';
import { cqInterventionTypes } from './src/db/schema';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Reading CSV...');
  const csvPath = path.join(process.cwd(), 'Tipo de intervencion.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
  
  // Deduplicate case-insensitive
  const uniqueNames = new Set<string>();
  const toInsert = [];
  
  let codeCounter = 1;
  for (const line of lines) {
    if (!uniqueNames.has(line.toUpperCase())) {
      uniqueNames.add(line.toUpperCase());
      const codeStr = codeCounter.toString().padStart(4, '0');
      toInsert.push({
        code: `TINT-${codeStr}`,
        name: line,
      });
      codeCounter++;
    }
  }

  console.log(`Found ${toInsert.length} unique interventions. Seeding...`);
  
  try {
    const res = await db.insert(cqInterventionTypes).values(toInsert).onConflictDoNothing();
    console.log('Done seeding interventions!');
  } catch (err) {
    console.error('Error seeding interventions:', err);
  }
  
  process.exit(0);
}

main();
