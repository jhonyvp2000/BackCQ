import 'dotenv/config';
import { getSurgeriesByDateDesc } from './src/app/actions/cirugias';
async function test() {
  const rows = await getSurgeriesByDateDesc();
  console.dir(rows[0], { depth: null });
  process.exit(0);
}
test().catch(console.error);
