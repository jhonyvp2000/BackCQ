const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`ALTER TABLE cq_surgeries ADD COLUMN bed_number VARCHAR(50)`;
    console.log("Added bed_number");
  } catch (e) {
    if (e.message?.includes('already exists')) console.log("bed_number already exists");
    else throw e;
  }
  
  try {
    await sql`ALTER TABLE cq_surgeries ADD COLUMN internal_code VARCHAR(100)`;
    console.log("Added internal_code");
  } catch (e) {
    if (e.message?.includes('already exists')) console.log("internal_code already exists");
    else throw e;
  }
  
  console.log("Done");
  process.exit(0);
}

run().catch(console.error);
