#!/usr/bin/env node
/**
 * Import the full ISO country catalog into `countries` (browse + currency/locale).
 *
 * Source: dr5hn/countries-states-cities-database (ODbL, attribution required)
 * https://github.com/dr5hn/countries-states-cities-database
 *
 * Preserves existing map_center / map_bounds for countries already configured
 * (e.g. UG supply market). All countries are marked is_active for global browse;
 * listing supply remains gated separately (SUPPLY_MARKET_CODES in the web app).
 *
 * Usage: node scripts/seed-countries-catalog.mjs   (or: yarn db:seed:countries)
 * Then:  yarn db:seed:geo   (seeds geo_places for every active country)
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const COUNTRIES_URL =
  "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json";

/** ISO 4217 codes that are non-standard in dr5hn — skip or normalize. */
const INVALID_CURRENCIES = new Set(["", "null", "undefined"]);

/**
 * dr5hn ships non-ISO/placeholder currency codes for a few territories with no
 * real circulating currency. Map them to the currency actually used on the
 * ground so FX seeding (open.er-api.com) has coverage and the app never shows a
 * phantom code with no rate. AQ → USD (research stations transact in USD).
 */
const CURRENCY_OVERRIDES = { AQ: "USD" };

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const raw = readFileSync(join(root, file), "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    } catch {
      // optional
    }
  }
}

function displayLocaleFor(code, currency) {
  if (currency === "EUR") {
    const euroLocales = {
      DE: "de-DE",
      FR: "fr-FR",
      IT: "it-IT",
      ES: "es-ES",
      NL: "nl-NL",
      BE: "nl-BE",
      IE: "en-IE",
      AT: "de-AT",
      PT: "pt-PT",
      FI: "fi-FI",
    };
    return euroLocales[code] ?? "en-IE";
  }
  const known = {
    UG: "en-UG",
    GB: "en-GB",
    US: "en-US",
    CA: "en-CA",
    AU: "en-AU",
    NZ: "en-NZ",
    IN: "en-IN",
    SG: "en-SG",
    ZA: "en-ZA",
    KE: "en-KE",
    NG: "en-NG",
    GH: "en-GH",
    AE: "en-AE",
    SA: "en-SA",
    JP: "ja-JP",
    KR: "ko-KR",
    BR: "pt-BR",
    MX: "es-MX",
    SE: "sv-SE",
    NO: "nb-NO",
    DK: "da-DK",
    CH: "de-CH",
  };
  return known[code] ?? `en-${code}`;
}

async function main() {
  loadEnv();
  const connectionString =
    process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
  if (!connectionString) {
    console.error("Set DIRECT_URL or DATABASE_URL in .env");
    process.exit(1);
  }

  console.log("Fetching country catalog…");
  const res = await fetch(COUNTRIES_URL);
  if (!res.ok) {
    console.error(`Failed to fetch countries.json (${res.status})`);
    process.exit(1);
  }
  const countries = await res.json();
  if (!Array.isArray(countries)) {
    console.error("Unexpected countries.json shape");
    process.exit(1);
  }

  const useSupabaseSsl =
    connectionString.includes("supabase.co") ||
    connectionString.includes("pooler.supabase.com");

  const client = new pg.Client({
    connectionString,
    ssl: useSupabaseSsl ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  let inserted = 0;
  let skipped = 0;

  for (const row of countries) {
    const code = String(row.iso2 ?? "").trim().toUpperCase();
    const name = String(row.name ?? "").trim();
    const currency =
      CURRENCY_OVERRIDES[code] ??
      String(row.currency ?? "USD")
        .trim()
        .toUpperCase()
        .slice(0, 3);

    if (!/^[A-Z]{2}$/.test(code) || !name) {
      skipped++;
      continue;
    }
    if (INVALID_CURRENCIES.has(currency) || currency.length !== 3) {
      skipped++;
      continue;
    }

    const locale = displayLocaleFor(code, currency);

    await client.query(
      `INSERT INTO countries (
         code, name, currency, display_locale, is_active
       ) VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         currency = EXCLUDED.currency,
         display_locale = EXCLUDED.display_locale,
         is_active = TRUE`,
      [code, name, currency, locale],
    );
    inserted++;
  }

  const { rows: total } = await client.query(
    `SELECT COUNT(*)::int AS n FROM countries WHERE is_active = TRUE`,
  );

  console.log(
    `Catalog updated: ${inserted} countries processed, ${skipped} skipped, ${total[0].n} active total.`,
  );
  console.log(
    "Next: run `yarn db:seed:geo` to populate search areas for all active countries.",
  );
  console.log(
    "Attribution: Data by Countries States Cities Database (ODbL) — https://github.com/dr5hn/countries-states-cities-database",
  );

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
