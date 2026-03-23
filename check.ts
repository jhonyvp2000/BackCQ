import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
    try {
        await sql`ALTER TABLE cq_patient_pii ADD COLUMN IF NOT EXISTS direccion TEXT`;
        const res = await sql`SELECT direccion FROM cq_patient_pii LIMIT 1`;
        console.log("TEST RESULT:", res);
        process.exit(0);
    } catch(e) {
        console.error("TEST ERR:", e);
        process.exit(1);
    }
}
main();
