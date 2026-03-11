import "dotenv/config";
import { lookupPatientByDni } from "./src/app/actions/pacientes";

async function main() {
    const res = await lookupPatientByDni("09791568");
    console.log("LOOKUP:", res);
    process.exit(0);
}

main().catch(console.error);
