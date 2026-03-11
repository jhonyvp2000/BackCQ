import "dotenv/config";
import { db } from "./src/db";
import { cqPatientPii } from "./src/db/schema";

async function main() {
    const res = await db.select().from(cqPatientPii);
    console.log("PII Records:");
    res.forEach(r => console.log(r));
    process.exit(0);
}

main().catch(console.error);
