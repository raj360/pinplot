#!/usr/bin/env node
/**
 * Remove dev-only seed buildings (names prefixed with [DEV]).
 * Run before production deploy: `yarn db:seed:dev:clean`
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  try {
    const envPath = join(root, ".env");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DIRECT_URL (or DATABASE_URL) is not set.");
  process.exit(1);
}

function supabaseSsl(connectionString) {
  return (
    connectionString.includes("supabase.co") ||
    connectionString.includes("pooler.supabase.com")
  );
}

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: supabaseSsl(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
  });

  await client.connect();
  const { rowCount } = await client.query(
    "DELETE FROM buildings WHERE name LIKE '[DEV]%' RETURNING id",
  );
  await client.end();
  console.log(`Removed ${rowCount ?? 0} dev seed building(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
