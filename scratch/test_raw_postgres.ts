import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ override: true });

async function main() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    
    // Test 1: Using connection string
    try {
        console.log("Testing Connection String...");
        const sql1 = postgres(process.env.DATABASE_URL as string, { prepare: false });
        const res = await sql1`SELECT current_user, now()`;
        console.log("Success with Connection String:", res);
        await sql1.end();
    } catch (err: any) {
        console.error("Failed Test 1 (Connection String):", err.message, err.stack);
    }

    // Test 2: Using options object
    try {
        console.log("Testing Options Object...");
        const sql2 = postgres({
            host: "localhost",
            port: 6432,
            username: "jvp_user",
            password: "V3l4p4r3d3s",
            database: "ogess",
            prepare: false
        });
        const res = await sql2`SELECT current_user, now()`;
        console.log("Success with Options Object:", res);
        await sql2.end();
    } catch (err: any) {
        console.error("Failed Test 2 (Options Object):", err.message, err.stack);
    }
}

main();
