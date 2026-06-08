#!/usr/bin/env node
/**
 * Refresh display + Flutterwave presentment FX rates in the `fx_rates` table.
 *
 * Canonical pricing stays in UGX; these rates drive:
 *   - listing rent footnotes (viewer currency),
 *   - unlock fee presentment (viewer currency),
 *   - Flutterwave charge currency for non-UGX markets.
 *
 * Source: https://open.er-api.com (free, no API key). Falls back to leaving the
 * existing seeded rates untouched on any failure.
 *
 * Usage: node scripts/refresh-fx-rates.mjs   (or: yarn fx:refresh)
 * Uses DIRECT_URL from .env (session pooler :5432), falling back to DATABASE_URL.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Fallback when the DB catalog is unavailable (offline bootstrap).
const FALLBACK_CURRENCIES = ["UGX", "USD", "GBP", "EUR"];

function loadEnv() {
  try {
    const content = readFileSync(join(root, ".env"), "utf8");
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
    /* .env optional if vars exported */
  }
}

loadEnv();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DIRECT_URL (or DATABASE_URL) is not set in .env");
  process.exit(1);
}

function supabaseSsl(cs) {
  return cs.includes("supabase.co") || cs.includes("pooler.supabase.com");
}

/**
 * Fetch USD-based rates once, then derive every CURRENCIES×CURRENCIES pair via
 * cross-rates. `rate(base→quote) = usdPerQuote / usdPerBase` where the API gives
 * `quotePerUsd`, so `rate = quotePerUsd / basePerUsd`.
 */
async function fetchUsdRates() {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error(`FX API HTTP ${res.status}`);
  const body = await res.json();
  if (body.result !== "success" || !body.rates) {
    throw new Error("FX API returned no rates");
  }
  return body.rates; // { UGX: 3800, USD: 1, KES: 129, ... } = units per 1 USD
}

async function loadCatalogCurrencies(client) {
  const { rows } = await client.query(
    `SELECT DISTINCT currency FROM countries WHERE is_active = TRUE ORDER BY currency`,
  );
  const fromDb = rows.map((row) => String(row.currency).toUpperCase()).filter(Boolean);
  if (fromDb.length === 0) {
    return FALLBACK_CURRENCIES;
  }
  if (!fromDb.includes("UGX")) fromDb.unshift("UGX");
  return fromDb;
}

/** Currencies the free FX API does not publish (sanctions, obsolete codes). */
const SKIP_CURRENCIES = new Set(["AAD", "KPW"]);

/**
 * Seed UGX ↔ quote pairs only (canonical hub). convertMoney crosses via UGX
 * for any listing currency → viewer currency without N² DB rows.
 */
function buildHubPairs(usdRates, currencies) {
  const hub = "UGX";
  const hubPerUsd = usdRates[hub];
  if (!hubPerUsd) throw new Error("FX API missing UGX rate");

  const supported = currencies.filter((code) => {
    if (SKIP_CURRENCIES.has(code)) {
      console.warn(`Skipping unsupported currency ${code}.`);
      return false;
    }
    if (!usdRates[code]) {
      console.warn(`No USD rate for ${code}; skipping.`);
      return false;
    }
    return true;
  });

  const pairs = [{ base: hub, quote: hub, rate: 1 }];
  for (const quote of supported) {
    if (quote === hub) continue;
    const quotePerUsd = usdRates[quote];
    // units of quote per 1 UGX
    const ugxToQuote = quotePerUsd / hubPerUsd;
    pairs.push({ base: hub, quote, rate: ugxToQuote });
    pairs.push({ base: quote, quote: hub, rate: hubPerUsd / quotePerUsd });
  }
  return pairs;
}

async function main() {
  const usdRates = await fetchUsdRates();

  const client = new pg.Client({
    connectionString,
    ssl: supabaseSsl(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
  });
  await client.connect();

  const currencies = await loadCatalogCurrencies(client);
  const pairs = buildHubPairs(usdRates, currencies);
  if (pairs.length === 0) throw new Error("No FX pairs computed");

  let updated = 0;
  await client.query("BEGIN");
  try {
    for (const { base, quote, rate } of pairs) {
      await client.query(
        `INSERT INTO fx_rates (base_currency, quote_currency, rate, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (base_currency, quote_currency)
         DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW()`,
        [base, quote, rate.toFixed(10)],
      );
      updated += 1;
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }

  await client.end();
  console.log(
    `Refreshed ${updated} FX pairs (${currencies.length} currencies) from open.er-api.com.`,
  );
}

main().catch((err) => {
  console.error("FX refresh failed:", err.message);
  process.exit(1);
});
