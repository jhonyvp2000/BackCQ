import "dotenv/config";
import { getDashboardStats } from "./src/app/actions/dashboard";

async function main() {
    const stats = await getDashboardStats();
    console.log("FINAL DASHBOARD STATS:", JSON.stringify(stats, null, 2));
    process.exit(0);
}

main().catch(console.error);
