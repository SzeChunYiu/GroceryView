#!/usr/bin/env node
/**
 * Read-only Sweden POI audit report.
 *
 * Required environment:
 * - DATABASE_URL: PostgreSQL URL for the GroceryView database. The script only
 *   executes SE_POI_AUDIT_STORES_QUERY against stores/chains.
 * - Network access to Overpass API. The audit job fetches Swedish POIs with
 *   SE_POI_AUDIT_OVERPASS_QUERY from the public Overpass interpreter.
 *
 * Optional flags:
 * - --output <path>: write the JSON report to a file in addition to stdout.
 * - --compact: print compact JSON instead of pretty JSON.
 * - --self-test: run against in-memory fixtures without DB or Overpass access.
 */
import { writeFile } from 'node:fs/promises';
import process from 'node:process';

function parseArgs(argv) {
  const args = {
    compact: false,
    outputPath: '',
    selfTest: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--compact') {
      args.compact = true;
      continue;
    }
    if (arg === '--self-test') {
      args.selfTest = true;
      continue;
    }
    if (arg === '--output') {
      const outputPath = argv[index + 1];
      if (!outputPath) throw new Error('--output requires a file path.');
      args.outputPath = outputPath;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

async function loadAuditJob() {
  try {
    return await import('../../packages/ingestion/dist/jobs/se-poi-audit.js');
  } catch (error) {
    throw new Error(`Build @groceryview/ingestion before running the SE POI audit report: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function loadPg() {
  try {
    return await import('pg');
  } catch (error) {
    throw new Error(`Install workspace dependencies before reading SE stores from PostgreSQL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function readSeStores({ databaseUrl, storesQuery, pgModule }) {
  const { Pool } = pgModule;
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const result = await pool.query(storesQuery);
    return result.rows;
  } finally {
    await pool.end();
  }
}

function summarizeReport(report) {
  const unlinkedSupermarkets = report.unlinkedPois.filter((poi) => poi.shop === 'supermarket');
  return {
    generatedAt: report.generatedAt,
    counts: {
      unknown_chain: report.totals.unknownChain,
      missing_store_match: report.totals.missingStoreMatch,
      unlinkedSupermarkets: report.totals.unlinkedSupermarkets
    },
    totals: report.totals,
    unlinkedSupermarkets: unlinkedSupermarkets.map((poi) => ({
      osmType: poi.osmType,
      osmId: poi.osmId,
      name: poi.name,
      brand: poi.brand,
      operator: poi.operator,
      chain: poi.chain,
      reason: poi.reason,
      city: poi.city,
      nearestStoreSlug: poi.nearestStoreSlug,
      nearestStoreDistanceMeters: poi.nearestStoreDistanceMeters,
      sourceUrl: poi.sourceUrl,
      retrievedAt: poi.retrievedAt
    }))
  };
}

function selfTestAuditJob() {
  const retrievedAt = '2026-05-25T00:00:00.000Z';
  const pois = [
    {
      osmType: 'node',
      osmId: 1,
      name: 'Unknown Matbutik',
      brand: '',
      operator: '',
      domain: 'grocery',
      chain: 'unknown',
      shop: 'supermarket',
      amenity: '',
      latitude: 59.334,
      longitude: 18.063,
      street: '',
      houseNumber: '',
      postcode: '',
      city: 'Stockholm',
      openingHours: '',
      website: '',
      phone: '',
      sourceUrl: 'self-test',
      retrievedAt
    },
    {
      osmType: 'node',
      osmId: 2,
      name: 'ICA Test',
      brand: 'ICA',
      operator: '',
      domain: 'grocery',
      chain: 'ica',
      shop: 'supermarket',
      amenity: '',
      latitude: 59.335,
      longitude: 18.064,
      street: '',
      houseNumber: '',
      postcode: '',
      city: 'Stockholm',
      openingHours: '',
      website: '',
      phone: '',
      sourceUrl: 'self-test',
      retrievedAt
    }
  ];
  const stores = [{
    store_id: 'store-1',
    store_slug: 'ica-nearby',
    store_name: 'ICA Nearby',
    chain_slug: 'ica',
    chain_name: 'ICA',
    external_ref: null,
    country_code: 'SE',
    latitude: 59.335,
    longitude: 18.064,
    city: 'Stockholm'
  }];

  return {
    SE_POI_AUDIT_OVERPASS_QUERY: 'self-test-overpass-query',
    SE_POI_AUDIT_STORES_QUERY: 'self-test-stores-query',
    fetchSwedenPoiAudit: async () => pois,
    buildSwedenPoiAuditReport: (inputPois, inputStores, generatedAt) => {
      const unlinkedPois = inputPois.flatMap((poi) => {
        if (poi.chain === 'unknown') {
          return [{ ...poi, reason: 'unknown_chain', nearestStoreSlug: '', nearestStoreDistanceMeters: null }];
        }
        const matched = inputStores.some((store) => store.chain_slug === poi.chain);
        return matched ? [] : [{ ...poi, reason: 'missing_store_match', nearestStoreSlug: '', nearestStoreDistanceMeters: null }];
      });
      return {
        generatedAt,
        totals: {
          pois: inputPois.length,
          grocery: inputPois.filter((poi) => poi.domain === 'grocery').length,
          pharmacy: inputPois.filter((poi) => poi.domain === 'pharmacy').length,
          fuel: inputPois.filter((poi) => poi.domain === 'fuel').length,
          unknownChain: unlinkedPois.filter((poi) => poi.reason === 'unknown_chain').length,
          missingStoreMatch: unlinkedPois.filter((poi) => poi.reason === 'missing_store_match').length,
          unlinkedSupermarkets: unlinkedPois.filter((poi) => poi.shop === 'supermarket').length
        },
        unlinkedPois
      };
    },
    stores
  };
}

export async function printSePoiAuditReport({
  auditJob,
  databaseUrl = process.env.DATABASE_URL,
  generatedAt = new Date().toISOString(),
  pgModule,
  selfTest = false
} = {}) {
  const source = auditJob ?? (selfTest ? selfTestAuditJob() : await loadAuditJob());
  const [pois, stores] = await Promise.all([
    source.fetchSwedenPoiAudit(),
    selfTest
      ? Promise.resolve(source.stores)
      : readSeStores({
        databaseUrl: databaseUrl || missingDatabaseUrl(),
        storesQuery: source.SE_POI_AUDIT_STORES_QUERY,
        pgModule: pgModule ?? await loadPg()
      })
  ]);
  const report = source.buildSwedenPoiAuditReport(pois, stores, generatedAt);

  return {
    ...summarizeReport(report),
    source: {
      poiSource: 'Overpass SE POI audit',
      storesSource: 'PostgreSQL stores/chains read-only query',
      overpassQuery: source.SE_POI_AUDIT_OVERPASS_QUERY,
      storesQuery: source.SE_POI_AUDIT_STORES_QUERY
    }
  };
}

function missingDatabaseUrl() {
  throw new Error('DATABASE_URL is required unless --self-test is used.');
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = await printSePoiAuditReport({ selfTest: args.selfTest });
    const json = `${JSON.stringify(result, null, args.compact ? 0 : 2)}\n`;
    if (args.outputPath) await writeFile(args.outputPath, json);
    process.stdout.write(json);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
