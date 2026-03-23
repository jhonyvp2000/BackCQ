const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    const res = await client.query('SELECT code, name FROM cq_procedures');
    
    fs.writeFileSync('../ApiNetHos/postgres_procedures.json', JSON.stringify(res.rows, null, 2));
    console.log("Successfully extracted", res.rows.length, "procedures from Postgres.");

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

main();
