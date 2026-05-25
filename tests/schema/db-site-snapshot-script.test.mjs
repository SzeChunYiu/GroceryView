import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildDbSiteChainPriceObservations,
  buildDbSiteAxfoodProducts,
  buildDbSiteSnapshotArtifact,
  readFreshDbSiteSnapshotCache,
  renderDbSiteChainObservationsModule,
  renderDbSiteIngestedOverridesModule,
  renderDbSiteProductsModule,
  validateDbSiteSnapshotCacheArtifact
} from '../../scripts/ingestion/export-db-site-snapshot.mjs';

const rootPackage = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const cliScriptPath = new URL('../../scripts/ingestion/export-db-site-snapshot.mjs', import.meta.url);

function writeFixturePostgresLoader(loaderPath) {
  writeFileSync(loaderPath, `
const dbModuleUrl = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(\`
export function createPgQueryExecutor(pool) {
  return {
    query: (...args) => pool.query(...args)
  };
}

export function createPostgresSiteSnapshotReader(executor) {
  return {
    async listLatestPriceSnapshotRows() {
      await executor.query({ text: 'select fixture_latest_prices' });
    }
  };
}

export function createPostgresTrendingPriceChangeReader(executor) {
  return {
    async listTrendingPriceChanges() {
      await executor.query({ text: 'select fixture_trending_price_changes' });
    }
  };
}
\`);

const pgModuleUrl = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(\`
export class Pool {
  constructor(config) {
    this.config = config;
  }

  async query() {
    throw new Error('fixture_unusable_database_url:' + this.config.connectionString);
  }

  async end() {}
}
\`);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@groceryview/db') return { url: dbModuleUrl, shortCircuit: true };
  if (specifier === 'pg') return { url: pgModuleUrl, shortCircuit: true };
  return nextResolve(specifier, context);
}
`);
}

function buildStaleDbSiteSnapshotFixture() {
  return buildDbSiteSnapshotArtifact({
    generatedAt: '2026-01-01T00:00:00.000Z',
    requiredChains: ['willys'],
    rows: [{
      productId: 'product-1',
      productSlug: 'bryggkaffe-450g',
      canonicalName: 'Bryggkaffe mellanrost 450 g',
      categoryPath: ['Pantry', 'Coffee'],
      comparableUnit: 'kg',
      chainId: 'chain-1',
      chainSlug: 'willys',
      chainName: 'Willys',
      priceType: 'online',
      observationId: 'observation-stale-cache',
      price: 44.9,
      unitPrice: 99.7778,
      currency: 'SEK',
      observedAt: '2026-01-01T00:00:00.000Z',
      confidence: 0.88
    }]
  });
}

function runDbSiteSnapshotCliCacheMissFixture({ writeModulePath }) {
  const dir = mkdtempSync(join(tmpdir(), 'db-site-snapshot-cli-cache-miss-'));
  const outputPath = join(dir, 'snapshot.json');
  const modulePath = join(dir, 'db-site-products.ts');
  const loaderPath = join(dir, 'fixture-postgres-loader.mjs');
  const staleArtifactText = `${JSON.stringify(buildStaleDbSiteSnapshotFixture(), null, 2)}\n`;
  const staleModuleText = '// stale generated module that must not be rewritten\nexport const staleGeneratedFixture = true;\n';

  writeFixturePostgresLoader(loaderPath);
  writeFileSync(outputPath, staleArtifactText);
  if (writeModulePath) writeFileSync(modulePath, staleModuleText);

  const result = spawnSync(process.execPath, [
    '--experimental-loader',
    loaderPath,
    cliScriptPath.pathname
  ], {
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      DATABASE_URL: 'postgres://fixture.invalid/not-a-real-db',
      GROCERYVIEW_DB_SITE_SNAPSHOT_PATH: outputPath,
      GROCERYVIEW_DB_SITE_SNAPSHOT_MODULE_PATH: modulePath,
      GROCERYVIEW_DB_SITE_SNAPSHOT_CACHE_TTL_SECONDS: '60',
      GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS: 'willys'
    }
  });

  return {
    dir,
    outputPath,
    modulePath,
    staleArtifactText,
    staleModuleText,
    result
  };
}

describe('DB-backed site snapshot export script', () => {
  it('publishes a root operator command for DB-to-site snapshot generation', () => {
    assert.equal(rootPackage.scripts['ingest:export-db-snapshot'], 'npm run build -w @groceryview/db && node scripts/ingestion/export-db-site-snapshot.mjs');
  });

  it('builds a static-site artifact from latest_prices rows without raw private payloads', () => {
    const artifact = buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      rows: [{
        productId: 'product-1',
        productSlug: 'bryggkaffe-450g',
        canonicalName: 'Bryggkaffe mellanrost 450 g',
        brand: 'Rosteriet',
        categoryPath: ['Pantry', 'Coffee'],
        packageSize: 450,
        packageUnit: 'g',
        comparableUnit: 'kg',
        chainId: 'chain-1',
        chainSlug: 'willys',
        chainName: 'Willys',
        storeId: 'store-1',
        storeSlug: 'willys-hemma-stockholm-torsplan',
        storeExternalRef: 'seed:willys:torsplan',
        storeName: 'Willys Hemma Stockholm Torsplan',
        city: 'Stockholm',
        priceType: 'promotion',
        observationId: 'observation-2',
        price: 44.9,
        regularPrice: 59.9,
        unitPrice: 99.7778,
        currency: 'SEK',
        observedAt: '2026-05-20T09:00:00.000Z',
        confidence: 0.88,
        promotionText: 'Veckokampanj',
        promotionStartsOn: '2026-05-18',
        promotionEndsOn: '2026-05-24',
        memberRequired: true,
        validFrom: '2026-05-18T00:00:00.000Z',
        validUntil: '2026-05-24T23:59:59.000Z',
        retailerProductRef: 'willys:bryggkaffe-450g',
        provenance: { sourceType: 'retailer_page', rawSnapshotRef: 'raw://daily-ingestion/run/sha256-abcd' }
      }]
    });

    assert.equal(artifact.status, 'passed');
    assert.equal(artifact.generatedAt, '2026-05-22T21:20:00.000Z');
    assert.equal(artifact.source, 'postgres.latest_prices+observations');
    assert.equal(artifact.priceRows.length, 1);
    assert.deepEqual(artifact.coverage, { products: 1, chains: 1, stores: 1, observations: 1, requiredChains: ['willys'], missingRequiredChains: [], requiredStoreExternalRefs: [], missingRequiredStoreExternalRefs: [], requiredProductSlugs: [], missingRequiredProductSlugs: [], requiredPriceTypes: [], missingRequiredStorePriceTypes: [], requiredCategorySlugs: [], missingRequiredCategorySlugs: [] });
    assert.deepEqual(artifact.priceRows[0], {
      productSlug: 'bryggkaffe-450g',
      canonicalName: 'Bryggkaffe mellanrost 450 g',
      brand: 'Rosteriet',
      categoryPath: ['Pantry', 'Coffee'],
      packageSize: 450,
      packageUnit: 'g',
      comparableUnit: 'kg',
      chainSlug: 'willys',
      chainName: 'Willys',
      storeSlug: 'willys-hemma-stockholm-torsplan',
      storeExternalRef: 'seed:willys:torsplan',
      storeName: 'Willys Hemma Stockholm Torsplan',
      city: 'Stockholm',
      priceType: 'promotion',
      price: 44.9,
      regularPrice: 59.9,
      unitPrice: 99.7778,
      currency: 'SEK',
      observedAt: '2026-05-20T09:00:00.000Z',
      isAvailable: true,
      confidence: 0.88,
      observationId: 'observation-2',
      promotionText: 'Veckokampanj',
      promotionStartsOn: '2026-05-18',
      promotionEndsOn: '2026-05-24',
      memberRequired: true,
      validFrom: '2026-05-18T00:00:00.000Z',
      validUntil: '2026-05-24T23:59:59.000Z',
      retailerProductRef: 'willys:bryggkaffe-450g',
      provenance: { sourceType: 'retailer_page', rawSnapshotRef: 'raw://daily-ingestion/run/sha256-abcd' }
    });
    assert.equal(JSON.stringify(artifact).includes('rawPayload'), false);
  });

  it('fails closed when required chain coverage is missing from the DB snapshot', () => {
    assert.throws(() => buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['ica', 'willys'],
      rows: [{
        productId: 'product-1',
        productSlug: 'bryggkaffe-450g',
        canonicalName: 'Bryggkaffe mellanrost 450 g',
        categoryPath: ['Pantry', 'Coffee'],
        comparableUnit: 'kg',
        chainId: 'chain-1',
        chainSlug: 'willys',
        chainName: 'Willys',
        priceType: 'promotion',
        observationId: 'observation-2',
        price: 44.9,
        unitPrice: 99.7778,
        currency: 'SEK',
        observedAt: '2026-05-20T09:00:00.000Z',
        confidence: 0.88
      }]
    }), /db_site_snapshot_missing_required_chains:ica/);
  });

  it('records required chain coverage when every required chain has latest price evidence', () => {
    const base = {
      productId: 'product-1',
      productSlug: 'bryggkaffe-450g',
      canonicalName: 'Bryggkaffe mellanrost 450 g',
      categoryPath: ['Pantry', 'Coffee'],
      comparableUnit: 'kg',
      priceType: 'promotion',
      price: 44.9,
      unitPrice: 99.7778,
      currency: 'SEK',
      observedAt: '2026-05-20T09:00:00.000Z',
      confidence: 0.88
    };
    const artifact = buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['ica', 'willys'],
      rows: [
        { ...base, chainId: 'chain-1', chainSlug: 'willys', chainName: 'Willys', observationId: 'observation-willys' },
        { ...base, chainId: 'chain-2', chainSlug: 'ica', chainName: 'ICA', observationId: 'observation-ica' }
      ]
    });

    assert.deepEqual(artifact.coverage.requiredChains, ['ica', 'willys']);
    assert.deepEqual(artifact.coverage.missingRequiredChains, []);
  });

  it('fails closed when required store coverage is missing from the DB snapshot', () => {
    const base = {
      productId: 'product-1',
      productSlug: 'bryggkaffe-450g',
      canonicalName: 'Bryggkaffe mellanrost 450 g',
      categoryPath: ['Pantry', 'Coffee'],
      comparableUnit: 'kg',
      chainId: 'chain-1',
      chainSlug: 'willys',
      chainName: 'Willys',
      priceType: 'online',
      price: 44.9,
      unitPrice: 99.7778,
      currency: 'SEK',
      observedAt: '2026-05-20T09:00:00.000Z',
      confidence: 0.88
    };
    assert.throws(() => buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      requiredStoreExternalRefs: ['1004599', '216502'],
      rows: [{ ...base, storeExternalRef: '216502', observationId: 'observation-willys-216502' }]
    }), /db_site_snapshot_missing_required_stores:1004599/);
  });

  it('records required store coverage when every target store has latest price evidence', () => {
    const base = {
      productId: 'product-1',
      productSlug: 'bryggkaffe-450g',
      canonicalName: 'Bryggkaffe mellanrost 450 g',
      categoryPath: ['Pantry', 'Coffee'],
      comparableUnit: 'kg',
      chainId: 'chain-1',
      chainSlug: 'willys',
      chainName: 'Willys',
      priceType: 'online',
      price: 44.9,
      unitPrice: 99.7778,
      currency: 'SEK',
      observedAt: '2026-05-20T09:00:00.000Z',
      confidence: 0.88
    };
    const artifact = buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      requiredStoreExternalRefs: ['1004599', '216502'],
      rows: [
        { ...base, storeExternalRef: '216502', observationId: 'observation-willys-216502' },
        { ...base, storeExternalRef: '1004599', observationId: 'observation-willys-1004599' }
      ]
    });

    assert.deepEqual(artifact.coverage.requiredStoreExternalRefs, ['1004599', '216502']);
    assert.deepEqual(artifact.coverage.missingRequiredStoreExternalRefs, []);
  });

  it('fails closed when a required target store is missing a required price type', () => {
    const base = {
      productId: 'product-1',
      productSlug: 'bryggkaffe-450g',
      canonicalName: 'Bryggkaffe mellanrost 450 g',
      categoryPath: ['Pantry', 'Coffee'],
      comparableUnit: 'kg',
      chainId: 'chain-1',
      chainSlug: 'willys',
      chainName: 'Willys',
      storeExternalRef: '216502',
      price: 44.9,
      unitPrice: 99.7778,
      currency: 'SEK',
      observedAt: '2026-05-20T09:00:00.000Z',
      confidence: 0.88
    };
    assert.throws(() => buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      requiredStoreExternalRefs: ['216502'],
      requiredPriceTypes: ['online', 'promotion'],
      rows: [{ ...base, priceType: 'online', observationId: 'observation-online' }]
    }), /db_site_snapshot_missing_required_store_price_types:216502:promotion/);
  });

  it('records required store price-type coverage when every target store has every required type', () => {
    const base = {
      productId: 'product-1',
      productSlug: 'bryggkaffe-450g',
      canonicalName: 'Bryggkaffe mellanrost 450 g',
      categoryPath: ['Pantry', 'Coffee'],
      comparableUnit: 'kg',
      chainId: 'chain-1',
      chainSlug: 'willys',
      chainName: 'Willys',
      storeExternalRef: '216502',
      price: 44.9,
      unitPrice: 99.7778,
      currency: 'SEK',
      observedAt: '2026-05-20T09:00:00.000Z',
      confidence: 0.88
    };
    const artifact = buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      requiredStoreExternalRefs: ['216502'],
      requiredPriceTypes: ['online', 'promotion'],
      rows: [
        { ...base, priceType: 'online', observationId: 'observation-online' },
        { ...base, priceType: 'promotion', observationId: 'observation-promo' }
      ]
    });

    assert.deepEqual(artifact.coverage.requiredPriceTypes, ['online', 'promotion']);
    assert.deepEqual(artifact.coverage.missingRequiredStorePriceTypes, []);
  });

  it('fails closed when required category coverage is missing from the DB snapshot', () => {
    const base = {
      productId: 'product-1',
      productSlug: 'bryggkaffe-450g',
      canonicalName: 'Bryggkaffe mellanrost 450 g',
      chainId: 'chain-1',
      chainSlug: 'willys',
      chainName: 'Willys',
      comparableUnit: 'kg',
      priceType: 'online',
      price: 44.9,
      unitPrice: 99.7778,
      currency: 'SEK',
      observedAt: '2026-05-20T09:00:00.000Z',
      confidence: 0.88
    };
    assert.throws(() => buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      requiredCategorySlugs: ['coffee', 'dairy'],
      rows: [{ ...base, categoryPath: ['Pantry', 'Coffee'], observationId: 'observation-coffee' }]
    }), /db_site_snapshot_missing_required_categories:dairy/);
  });

  it('records required category coverage when every target category has latest price evidence', () => {
    const base = {
      chainId: 'chain-1',
      chainSlug: 'willys',
      chainName: 'Willys',
      comparableUnit: 'kg',
      priceType: 'online',
      price: 44.9,
      unitPrice: 99.7778,
      currency: 'SEK',
      observedAt: '2026-05-20T09:00:00.000Z',
      confidence: 0.88
    };
    const artifact = buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      requiredCategorySlugs: ['coffee', 'dairy'],
      rows: [
        { ...base, productId: 'product-1', productSlug: 'bryggkaffe-450g', canonicalName: 'Bryggkaffe mellanrost 450 g', categoryPath: ['Pantry', 'Coffee'], observationId: 'observation-coffee' },
        { ...base, productId: 'product-2', productSlug: 'mjolk-1l', canonicalName: 'Mjölk 1 l', categoryPath: ['Dairy'], observationId: 'observation-milk' }
      ]
    });

    assert.deepEqual(artifact.coverage.requiredCategorySlugs, ['coffee', 'dairy']);
    assert.deepEqual(artifact.coverage.missingRequiredCategorySlugs, []);
  });

  it('fails closed when required product coverage is missing from the DB snapshot', () => {
    const base = {
      chainId: 'chain-1',
      chainSlug: 'willys',
      chainName: 'Willys',
      categoryPath: ['Pantry', 'Coffee'],
      comparableUnit: 'kg',
      priceType: 'online',
      price: 44.9,
      unitPrice: 99.7778,
      currency: 'SEK',
      observedAt: '2026-05-20T09:00:00.000Z',
      confidence: 0.88
    };
    assert.throws(() => buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      requiredProductSlugs: ['bryggkaffe-450g', 'mjolk-1l'],
      rows: [{ ...base, productId: 'product-1', productSlug: 'bryggkaffe-450g', canonicalName: 'Bryggkaffe mellanrost 450 g', observationId: 'observation-coffee' }]
    }), /db_site_snapshot_missing_required_products:mjolk-1l/);
  });

  it('records required product coverage when every target product has latest price evidence', () => {
    const base = {
      chainId: 'chain-1',
      chainSlug: 'willys',
      chainName: 'Willys',
      categoryPath: ['Pantry', 'Coffee'],
      comparableUnit: 'kg',
      priceType: 'online',
      price: 44.9,
      unitPrice: 99.7778,
      currency: 'SEK',
      observedAt: '2026-05-20T09:00:00.000Z',
      confidence: 0.88
    };
    const artifact = buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      requiredProductSlugs: ['bryggkaffe-450g', 'mjolk-1l'],
      rows: [
        { ...base, productId: 'product-1', productSlug: 'bryggkaffe-450g', canonicalName: 'Bryggkaffe mellanrost 450 g', observationId: 'observation-coffee' },
        { ...base, productId: 'product-2', productSlug: 'mjolk-1l', canonicalName: 'Mjölk 1 l', observationId: 'observation-milk' }
      ]
    });

    assert.deepEqual(artifact.coverage.requiredProductSlugs, ['bryggkaffe-450g', 'mjolk-1l']);
    assert.deepEqual(artifact.coverage.missingRequiredProductSlugs, []);
  });

  it('fails closed when snapshot latest-price evidence is older than the allowed age', () => {
    assert.throws(() => buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      maxObservedAgeHours: 24,
      rows: [{
        productId: 'product-1',
        productSlug: 'bryggkaffe-450g',
        canonicalName: 'Bryggkaffe mellanrost 450 g',
        categoryPath: ['Pantry', 'Coffee'],
        comparableUnit: 'kg',
        chainId: 'chain-1',
        chainSlug: 'willys',
        chainName: 'Willys',
        priceType: 'online',
        observationId: 'observation-stale',
        price: 44.9,
        unitPrice: 99.7778,
        currency: 'SEK',
        observedAt: '2026-05-20T09:00:00.000Z',
        confidence: 0.88
      }]
    }), /db_site_snapshot_stale_observations:observation-stale/);
  });

  it('records freshness coverage when latest-price evidence is within the allowed age', () => {
    const artifact = buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      maxObservedAgeHours: 72,
      rows: [{
        productId: 'product-1',
        productSlug: 'bryggkaffe-450g',
        canonicalName: 'Bryggkaffe mellanrost 450 g',
        categoryPath: ['Pantry', 'Coffee'],
        comparableUnit: 'kg',
        chainId: 'chain-1',
        chainSlug: 'willys',
        chainName: 'Willys',
        priceType: 'online',
        observationId: 'observation-fresh',
        price: 44.9,
        unitPrice: 99.7778,
        currency: 'SEK',
        observedAt: '2026-05-22T09:00:00.000Z',
        confidence: 0.88
      }]
    });

    assert.equal(artifact.coverage.maxObservedAgeHours, 72);
    assert.equal(artifact.coverage.staleObservationCount, 0);
    assert.deepEqual(artifact.coverage.staleObservationIds, []);
  });

  it('accepts a cached snapshot only while TTL, coverage, and freshness are still valid', () => {
    const artifact = buildDbSiteSnapshotArtifact({
      generatedAt: '2026-05-22T21:20:00.000Z',
      requiredChains: ['willys'],
      maxObservedAgeHours: 36,
      rows: [{
        productId: 'product-1',
        productSlug: 'bryggkaffe-450g',
        canonicalName: 'Bryggkaffe mellanrost 450 g',
        categoryPath: ['Pantry', 'Coffee'],
        comparableUnit: 'kg',
        chainId: 'chain-1',
        chainSlug: 'willys',
        chainName: 'Willys',
        priceType: 'online',
        observationId: 'observation-fresh',
        price: 44.9,
        unitPrice: 99.7778,
        currency: 'SEK',
        observedAt: '2026-05-22T09:00:00.000Z',
        confidence: 0.88
      }]
    });

    assert.equal(validateDbSiteSnapshotCacheArtifact({
      artifact,
      cacheTtlSeconds: 60 * 60,
      maxObservedAgeHours: 36,
      now: new Date('2026-05-22T21:40:00.000Z')
    }), true);
    assert.equal(validateDbSiteSnapshotCacheArtifact({
      artifact,
      cacheTtlSeconds: 60,
      maxObservedAgeHours: 36,
      now: new Date('2026-05-22T21:40:00.000Z')
    }), false);
    assert.equal(validateDbSiteSnapshotCacheArtifact({
      artifact,
      cacheTtlSeconds: 60 * 60,
      maxObservedAgeHours: 12,
      now: new Date('2026-05-22T21:40:00.000Z')
    }), false);
    assert.equal(validateDbSiteSnapshotCacheArtifact({
      artifact: { ...artifact, coverage: { ...artifact.coverage, missingRequiredChains: ['ica'] } },
      cacheTtlSeconds: 60 * 60,
      maxObservedAgeHours: 36,
      now: new Date('2026-05-22T21:40:00.000Z')
    }), false);
  });

  it('reuses a cached snapshot only when every requested output already exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'db-site-snapshot-cache-'));
    try {
      const outputPath = join(dir, 'snapshot.json');
      const modulePath = join(dir, 'db-site-products.ts');
      const artifact = buildDbSiteSnapshotArtifact({
        generatedAt: new Date().toISOString(),
        requiredChains: ['willys'],
        rows: [{
          productId: 'product-1',
          productSlug: 'bryggkaffe-450g',
          canonicalName: 'Bryggkaffe mellanrost 450 g',
          categoryPath: ['Pantry', 'Coffee'],
          comparableUnit: 'kg',
          chainId: 'chain-1',
          chainSlug: 'willys',
          chainName: 'Willys',
          priceType: 'online',
          observationId: 'observation-fresh',
          price: 44.9,
          unitPrice: 99.7778,
          currency: 'SEK',
          observedAt: new Date().toISOString(),
          confidence: 0.88
        }]
      });
      writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);

      assert.equal(readFreshDbSiteSnapshotCache({
        outputPath,
        modulePath,
        cacheTtlSeconds: 60
      }), undefined);

      writeFileSync(modulePath, renderDbSiteProductsModule({ generatedAt: artifact.generatedAt, rows: artifact.priceRows }));
      assert.deepEqual(readFreshDbSiteSnapshotCache({
        outputPath,
        modulePath,
        cacheTtlSeconds: 60
      }), artifact);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('falls through to the Postgres reader on an expired CLI cache without rewriting stale outputs', () => {
    const fixture = runDbSiteSnapshotCliCacheMissFixture({ writeModulePath: true });
    try {
      assert.notEqual(fixture.result.status, 0);
      assert.match(fixture.result.stderr, /fixture_unusable_database_url:postgres:\/\/fixture\.invalid\/not-a-real-db/);
      assert.equal(readFileSync(fixture.outputPath, 'utf8'), fixture.staleArtifactText);
      assert.equal(readFileSync(fixture.modulePath, 'utf8'), fixture.staleModuleText);
    } finally {
      rmSync(fixture.dir, { recursive: true, force: true });
    }
  });

  it('falls through to the Postgres reader on an incomplete CLI cache without rewriting stale outputs', () => {
    const fixture = runDbSiteSnapshotCliCacheMissFixture({ writeModulePath: false });
    try {
      assert.notEqual(fixture.result.status, 0);
      assert.match(fixture.result.stderr, /fixture_unusable_database_url:postgres:\/\/fixture\.invalid\/not-a-real-db/);
      assert.equal(readFileSync(fixture.outputPath, 'utf8'), fixture.staleArtifactText);
      assert.equal(existsSync(fixture.modulePath), false);
    } finally {
      rmSync(fixture.dir, { recursive: true, force: true });
    }
  });

  it('fails closed when the database reader returns no latest price rows', () => {
    assert.throws(() => buildDbSiteSnapshotArtifact({ generatedAt: '2026-05-22T21:20:00.000Z', rows: [] }), /No latest price rows available/);
  });

  it('maps latest_prices rows to the AxfoodProduct shape rendered by web pages', () => {
    const rows = [
      {
        productSlug: 'bryggkaffe-450g',
        canonicalName: 'Bryggkaffe mellanrost 450 g',
        brand: 'Rosteriet',
        categoryPath: ['Pantry', 'Coffee'],
        packageSize: 450,
        packageUnit: 'g',
        comparableUnit: 'kg',
        chainSlug: 'willys',
        chainName: 'Willys',
        priceType: 'promotion',
        price: 44.9,
        regularPrice: 59.9,
        unitPrice: 99.7778,
        currency: 'SEK',
        observedAt: '2026-05-20T09:00:00.000Z',
        confidence: 0.88,
        observationId: 'observation-2',
        provenance: {}
      },
      {
        productSlug: 'bryggkaffe-450g',
        canonicalName: 'Bryggkaffe mellanrost 450 g',
        brand: 'Rosteriet',
        categoryPath: ['Pantry', 'Coffee'],
        packageSize: 450,
        packageUnit: 'g',
        comparableUnit: 'kg',
        chainSlug: 'willys',
        chainName: 'Willys',
        priceType: 'shelf',
        price: 52.9,
        unitPrice: 117.5556,
        currency: 'SEK',
        observedAt: '2026-05-20T10:00:00.000Z',
        confidence: 0.91,
        observationId: 'observation-2b',
        provenance: {}
      },
      {
        productSlug: 'bryggkaffe-450g',
        canonicalName: 'Bryggkaffe mellanrost 450 g',
        brand: 'Rosteriet',
        categoryPath: ['Pantry', 'Coffee'],
        packageSize: 450,
        packageUnit: 'g',
        comparableUnit: 'kg',
        chainSlug: 'hemkop',
        chainName: 'Hemköp',
        priceType: 'shelf',
        price: 58.9,
        unitPrice: 130.8889,
        currency: 'SEK',
        observedAt: '2026-05-20T09:05:00.000Z',
        confidence: 0.86,
        observationId: 'observation-3',
        provenance: {}
      }
    ];

    assert.deepEqual(buildDbSiteAxfoodProducts(rows), [{
      code: 'bryggkaffe-450g',
      slug: 'bryggkaffe-450g',
      name: 'Bryggkaffe mellanrost 450 g',
      brand: 'Rosteriet',
      subline: 'Rosteriet, 450g',
      category: 'pantry',
      image: '',
      labels: [],
      chains: {
        hemkop: {
          price: 58.9,
          priceText: '58,90 kr',
          priceUnit: 'kr/st',
          isAvailable: true,
          savings: null,
          url: ''
        },
        willys: {
          price: 44.9,
          priceText: '44,90 kr',
          priceUnit: 'kr/st',
          isAvailable: true,
          savings: 15,
          url: ''
        }
      },
      lowestChain: 'willys',
      lowestPrice: 44.9,
      highestPrice: 58.9,
      spreadPct: 31.2,
      inChains: ['hemkop', 'willys']
    }]);
  });

  it('renders the generated module imported by apps/web/src/lib/axfood-products.ts', () => {
    const moduleText = renderDbSiteProductsModule({
      generatedAt: '2026-05-22T21:20:00.000Z',
      rows: [{
        productSlug: 'havregryn-1kg',
        canonicalName: 'Havregryn 1 kg',
        brand: 'Grynbolaget',
        categoryPath: ['Skafferi'],
        packageSize: 1,
        packageUnit: 'kg',
        comparableUnit: 'kg',
        chainSlug: 'willys',
        chainName: 'Willys',
        priceType: 'shelf',
        price: 18,
        unitPrice: 18,
        currency: 'SEK',
        observedAt: '2026-05-20T09:00:00.000Z',
        confidence: 0.9,
        observationId: 'observation-4',
        provenance: {}
      }]
    });

    assert.match(moduleText, /AUTO-GENERATED from postgres\.latest_prices\/observations/);
    assert.match(moduleText, /import type \{ AxfoodProduct \} from '\.\.\/axfood-products';/);
    assert.match(moduleText, /export const dbSiteSnapshotGeneratedAt = "2026-05-22T21:20:00.000Z";/);
    assert.match(moduleText, /export const dbSiteAxfoodProducts: AxfoodProduct\[] = \[/);
    assert.match(moduleText, /"slug": "havregryn-1kg"/);
  });

  it('maps latest_prices rows to the chain-index observation shape rendered by web pages', () => {
    const rows = [
      {
        productSlug: 'havregryn-1kg',
        canonicalName: 'Havregryn 1 kg',
        categoryPath: ['Skafferi'],
        packageSize: 1,
        packageUnit: 'kg',
        comparableUnit: 'kg',
        chainSlug: 'willys',
        chainName: 'Willys',
        priceType: 'shelf',
        price: 18,
        unitPrice: 18.123456,
        currency: 'SEK',
        observedAt: '2026-05-20T09:00:00.000Z',
        confidence: 0.9,
        observationId: 'observation-4',
        provenance: {}
      }
    ];

    assert.deepEqual(buildDbSiteChainPriceObservations(rows), [{
      chainId: 'Willys',
      category: 'skafferi · kg',
      unitPrice: 18.1235
    }]);

    const moduleText = renderDbSiteChainObservationsModule({
      generatedAt: '2026-05-22T21:20:00.000Z',
      rows
    });

    assert.match(moduleText, /AUTO-GENERATED from postgres\.latest_prices\/observations/);
    assert.match(moduleText, /import type \{ ChainPriceObservation \} from '@groceryview\/core';/);
    assert.match(moduleText, /export const dbSiteChainObservationsGeneratedAt = "2026-05-22T21:20:00.000Z";/);
    assert.match(moduleText, /export const dbSiteSnapshotChainPriceObservations: ChainPriceObservation\[] = \[/);
    assert.match(moduleText, /"category": "skafferi · kg"/);
  });

  it('renders ingested fixture override modules consumed by verified-data.ts', () => {
    const rows = [
      {
        productSlug: 'rod-paprika',
        canonicalName: 'Röd paprika',
        brand: '',
        categoryPath: ['Frukt och grönt'],
        packageSize: 1,
        packageUnit: 'kg',
        comparableUnit: 'kg',
        chainSlug: 'lidl',
        chainName: 'Lidl',
        storeSlug: 'lidl-alingsas',
        storeName: 'Lidl Alingsås',
        city: 'Alingsås',
        priceType: 'promotion',
        price: 29.9,
        regularPrice: 44.9,
        unitPrice: 29.9,
        currency: 'SEK',
        observedAt: '2026-05-22T14:34:06.870Z',
        confidence: 0.93,
        promotionText: '-33%',
        memberRequired: true,
        validFrom: '2026-05-18T00:00:00.000Z',
        validUntil: '2026-05-24T21:59:59.000Z',
        retailerProductRef: 'lidl:11029717',
        observationId: 'observation-lidl-1',
        provenance: { sourceUrl: 'https://www.lidl.se/c/veckans-frukt-groent/a10094676', productUrl: 'https://www.lidl.se/p/rod-paprika/p11029717' }
      },
      {
        productSlug: 'hamburgare-720g',
        canonicalName: 'Fryst hamburgare',
        brand: 'ICA',
        categoryPath: ['Djupfryst'],
        packageSize: 720,
        packageUnit: 'g',
        comparableUnit: 'kg',
        chainSlug: 'ica',
        chainName: 'ICA',
        storeSlug: 'ica-focus',
        storeName: 'ICA Focus',
        priceType: 'promotion',
        price: 70,
        regularPrice: 78.5,
        unitPrice: 97.2222,
        currency: 'SEK',
        observedAt: '2026-05-22T12:36:27.185Z',
        confidence: 0.91,
        memberRequired: false,
        validUntil: '2026-05-24T00:00:00.000Z',
        observationId: 'observation-ica-1',
        provenance: { sourceUrl: 'https://www.ica.se/erbjudanden/ica-focus-1004247/' }
      },
      {
        productSlug: 'idealmakaroner-1300g',
        canonicalName: 'Kungsörnen Gammaldags Idealmakaroner',
        brand: 'Kungsörnen',
        categoryPath: ['Skafferi'],
        packageSize: 1300,
        packageUnit: 'g',
        comparableUnit: 'kg',
        chainSlug: 'mathem',
        chainName: 'Mathem',
        priceType: 'shelf',
        price: 22.24,
        unitPrice: 17.11,
        currency: 'SEK',
        observedAt: '2026-05-22T15:36:00.328Z',
        confidence: 0.89,
        memberRequired: false,
        retailerProductRef: '6448',
        observationId: 'observation-mathem-1',
        provenance: { sourceUrl: 'https://www.mathem.se/se/search/products/?q=makaroner', productUrl: 'https://www.mathem.se/se/products/6448-kungsornen-gammaldags-idealmakaroner/' }
      }
    ];

    const moduleText = renderDbSiteIngestedOverridesModule({
      generatedAt: '2026-05-22T21:20:00.000Z',
      rows
    });

    assert.match(moduleText, /AUTO-GENERATED from postgres\.latest_prices\/observations/);
    assert.match(moduleText, /import type \{ LidlIngestedStoreOffer \} from '\.\.\/ingested\/lidl';/);
    assert.match(moduleText, /export const dbSiteIngestedOverridesGeneratedAt = "2026-05-22T21:20:00.000Z";/);
    assert.match(moduleText, /export const dbSiteMatpriskollenOffers: MatpriskollenIngestedOffer\[] = \[/);
    assert.match(moduleText, /export const dbSiteLidlStoreOffers: LidlIngestedStoreOffer\[] = \[/);
    assert.match(moduleText, /export const dbSiteIcaReklambladOffers: IcaReklambladIngestedOffer\[] = \[/);
    assert.match(moduleText, /export const dbSiteMathemProducts: MathemIngestedProduct\[] = \[/);
    assert.match(moduleText, /"storeName": "Lidl Alingsås"/);
    assert.match(moduleText, /"storeName": "ICA Focus"/);
    assert.match(moduleText, /"code": "6448"/);
    assert.match(moduleText, /"rowCount": 3/);
  });
});
