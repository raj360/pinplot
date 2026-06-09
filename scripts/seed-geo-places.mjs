#!/usr/bin/env node
/**
 * Seed geo_places from GeoNames country dumps + manual overrides.
 *
 * GeoNames data is free (CC-BY) — https://www.geonames.org/
 * Manual overrides: scripts/data/geo-places-manual.json (Kampala neighborhoods, etc.)
 *
 * Usage: node scripts/seed-geo-places.mjs   (or: yarn db:seed:geo)
 * Optional: GEO_COUNTRIES=UG,GB,US to limit seed scope.
 */
import { spawn } from "child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const BOUNDS_DELTA = {
  region: 0.16,
  district: 0.032,
  city: 0.08,
  neighborhood: 0.032,
};

const MAX_DISTRICTS = 40;
const MAX_CITIES = 35;
const MIN_CITY_POPULATION = 15_000;

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
      // optional file
    }
  }
}

function boundsAround(lat, lng, delta) {
  return {
    north: lat + delta,
    south: lat - delta,
    east: lng + delta,
    west: lng - delta,
  };
}

function slugify(name, kind, externalId) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${kind}-${base || "place"}-${externalId}`;
}

function parseGeonameLine(line, countryCode) {
  const cols = line.split("\t");
  if (cols.length < 15) return null;

  const geonameId = cols[0];
  const name = cols[1];
  const latStr = cols[4];
  const lngStr = cols[5];
  const featureClass = cols[6];
  const featureCode = cols[7];
  const country = cols[8];
  const populationStr = cols[14];

  if (country !== countryCode || (featureClass !== "A" && featureClass !== "P")) {
    return null;
  }

  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const population = Number(populationStr) || 0;

  if (featureClass === "A" && featureCode === "ADM1") {
    return {
      kind: "region",
      name,
      externalId: geonameId,
      lat,
      lng,
      population,
      sortOrder: population,
    };
  }

  if (featureClass === "A" && featureCode === "ADM2") {
    return {
      kind: "district",
      name,
      externalId: geonameId,
      lat,
      lng,
      population,
      sortOrder: population,
    };
  }

  if (featureClass === "P") {
    const cityCodes = new Set([
      "PPLC",
      "PPLA",
      "PPLA2",
      "PPLA3",
      "PPLA4",
      "PPL",
    ]);
    if (!cityCodes.has(featureCode)) return null;
    if (population < MIN_CITY_POPULATION && featureCode === "PPL") return null;
    return {
      kind: "city",
      name,
      externalId: geonameId,
      lat,
      lng,
      population,
      sortOrder: population,
    };
  }

  return null;
}

async function parseCountryZip(zipPath, countryCode) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const proc = spawn("unzip", ["-p", zipPath, `${countryCode}.txt`]);
    let pending = "";

    proc.stdout.on("data", (chunk) => {
      pending += chunk.toString("utf8");
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) {
        const parsed = parseGeonameLine(line, countryCode);
        if (parsed) rows.push(parsed);
      }
    });

    proc.stderr.on("data", (data) => {
      const msg = data.toString().trim();
      if (msg) console.warn(`  unzip ${countryCode}: ${msg}`);
    });

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`unzip exited ${code} for ${countryCode}`));
        return;
      }
      if (pending) {
        const parsed = parseGeonameLine(pending, countryCode);
        if (parsed) rows.push(parsed);
      }
      resolve(rows);
    });
  });
}

async function fetchCountryDump(countryCode) {
  const url = `https://download.geonames.org/export/dump/${countryCode}.zip`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  skip ${countryCode}: GeoNames dump not found (${res.status})`);
    return [];
  }

  const tmpDir = mkdtempSync(join(tmpdir(), "geonames-"));
  const zipPath = join(tmpDir, `${countryCode}.zip`);
  try {
    writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
    return await parseCountryZip(zipPath, countryCode);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function capByKind(rows) {
  const regions = rows.filter((r) => r.kind === "region");
  const districts = rows
    .filter((r) => r.kind === "district")
    .sort((a, b) => b.population - a.population)
    .slice(0, MAX_DISTRICTS);
  const cities = rows
    .filter((r) => r.kind === "city")
    .sort((a, b) => b.population - a.population)
    .slice(0, MAX_CITIES);
  return [...regions, ...districts, ...cities];
}

function loadManualPlaces() {
  const path = join(__dirname, "data/geo-places-manual.json");
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return raw.map((entry, index) => ({
    countryCode: entry.countryCode.toUpperCase(),
    kind: entry.kind,
    name: entry.name,
    slug: entry.slug,
    lat: entry.centerLat,
    lng: entry.centerLng,
    population: entry.population ?? 0,
    sortOrder: entry.sortOrder ?? 100 - index,
    source: "manual",
    externalId: entry.slug,
  }));
}

async function main() {
  loadEnv();
  const connectionString =
    process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
  if (!connectionString) {
    console.error("Set DIRECT_URL or DATABASE_URL in .env");
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

  const filter = process.env.GEO_COUNTRIES?.split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  const { rows: countryRows } = await client.query(
    `SELECT code FROM countries WHERE is_active = TRUE ORDER BY code`,
  );
  let countries = countryRows.map((r) => r.code);
  if (filter?.length) {
    countries = countries.filter((c) => filter.includes(c));
  }

  console.log(`Seeding geo_places for ${countries.length} countries…`);

  let total = 0;

  // Per-country atomic replace: each country's GeoNames rows are wiped and
  // re-inserted inside one transaction. A failure on any single country leaves
  // every already-seeded country intact (resume with GEO_COUNTRIES=<rest>),
  // instead of a global wipe that empties the table on the first error.
  for (const countryCode of countries) {
    process.stdout.write(`  ${countryCode}… `);
    let inserted = 0;
    try {
      const parsed = capByKind(await fetchCountryDump(countryCode));

      await client.query("BEGIN");
      await client.query(
        `DELETE FROM geo_places WHERE country_code = $1 AND source = 'geonames'`,
        [countryCode],
      );

      for (const row of parsed) {
        const slug = slugify(row.name, row.kind, row.externalId);
        const b = boundsAround(row.lat, row.lng, BOUNDS_DELTA[row.kind]);
        await client.query(
          `INSERT INTO geo_places (
             country_code, kind, name, slug,
             center_lat, center_lng,
             bounds_north, bounds_south, bounds_east, bounds_west,
             population, sort_order, source, external_id
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'geonames',$13)
           ON CONFLICT (country_code, slug) DO UPDATE SET
             name = EXCLUDED.name,
             center_lat = EXCLUDED.center_lat,
             center_lng = EXCLUDED.center_lng,
             bounds_north = EXCLUDED.bounds_north,
             bounds_south = EXCLUDED.bounds_south,
             bounds_east = EXCLUDED.bounds_east,
             bounds_west = EXCLUDED.bounds_west,
             population = EXCLUDED.population,
             sort_order = EXCLUDED.sort_order,
             source = EXCLUDED.source,
             external_id = EXCLUDED.external_id`,
          [
            countryCode,
            row.kind,
            row.name,
            slug,
            row.lat,
            row.lng,
            b.north,
            b.south,
            b.east,
            b.west,
            row.population || null,
            row.sortOrder || 0,
            row.externalId,
          ],
        );
        inserted++;
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      console.log(`failed (${err.message})`);
      continue;
    }

    console.log(`${inserted} places`);
    total += inserted;
  }

  const manual = loadManualPlaces();
  for (const row of manual) {
    if (filter?.length && !filter.includes(row.countryCode)) continue;
    const b = boundsAround(row.lat, row.lng, BOUNDS_DELTA[row.kind]);
    await client.query(
      `INSERT INTO geo_places (
         country_code, kind, name, slug,
         center_lat, center_lng,
         bounds_north, bounds_south, bounds_east, bounds_west,
         population, sort_order, source, external_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (country_code, slug) DO UPDATE SET
         name = EXCLUDED.name,
         kind = EXCLUDED.kind,
         center_lat = EXCLUDED.center_lat,
         center_lng = EXCLUDED.center_lng,
         bounds_north = EXCLUDED.bounds_north,
         bounds_south = EXCLUDED.bounds_south,
         bounds_east = EXCLUDED.bounds_east,
         bounds_west = EXCLUDED.bounds_west,
         sort_order = EXCLUDED.sort_order,
         source = EXCLUDED.source,
         external_id = EXCLUDED.external_id`,
      [
        row.countryCode,
        row.kind,
        row.name,
        row.slug,
        row.lat,
        row.lng,
        b.north,
        b.south,
        b.east,
        b.west,
        row.population || null,
        row.sortOrder,
        row.source,
        row.externalId,
      ],
    );
    total++;
  }

  console.log(`Done — ${total} geo_places rows (+ manual overrides).`);

  console.log("Backfilling countries.map_center / map_bounds from geo_places…");
  const { rowCount } = await client.query(`
    WITH best AS (
      SELECT DISTINCT ON (country_code)
        country_code,
        center_lat,
        center_lng,
        bounds_north,
        bounds_south,
        bounds_east,
        bounds_west
      FROM geo_places
      ORDER BY
        country_code,
        CASE kind
          WHEN 'city' THEN 1
          WHEN 'district' THEN 2
          WHEN 'region' THEN 3
          ELSE 4
        END,
        population DESC NULLS LAST,
        sort_order DESC
    )
    UPDATE countries c
    SET
      map_center_lat = best.center_lat,
      map_center_lng = best.center_lng,
      map_bounds_north = best.bounds_north,
      map_bounds_south = best.bounds_south,
      map_bounds_east = best.bounds_east,
      map_bounds_west = best.bounds_west
    FROM best
    WHERE c.code = best.country_code
      AND c.is_active = TRUE
      AND c.map_center_lat IS NULL
  `);
  console.log(`Updated map defaults for ${rowCount ?? 0} countries.`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
