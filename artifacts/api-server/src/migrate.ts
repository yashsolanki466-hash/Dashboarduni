import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@workspace/db";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrate() {
  console.log("Running migrations...");
  const migrationsFolder = path.resolve(__dirname, "../../../lib/db/drizzle");

  try {
    await migrate(db, { migrationsFolder });
    console.log("Migrations complete!");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrate();
