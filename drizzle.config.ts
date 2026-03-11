import { config } from "dotenv";
config({ path: ".env" });
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./src/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL as string,
    },
    tablesFilter: ["cq_*", "users", "roles", "permissions", "role_permissions", "user_system_roles", "professions", "staff_profiles"],
});
