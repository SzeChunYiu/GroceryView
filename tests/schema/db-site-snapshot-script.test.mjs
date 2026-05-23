import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDbSiteSnapshotArtifact } from '../../scripts/ingestion/export-db-site-snapshot.mjs';

const rootPackage = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

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
        provenance: { sourceType: 'retailer_page', rawSnapshotRef: 'raw://daily-ingestion/run/sha256-abcd' }
      }]
    });

    assert.equal(artifact.status, 'passed');
    assert.equal(artifact.generatedAt, '2026-05-22T21:20:00.000Z');
    assert.equal(artifact.priceRows.length, 1);
    assert.deepEqual(artifact.coverage, { products: 1, chains: 1, stores: 1, observations: 1, requiredChains: ['willys'], missingRequiredChains: [], requiredStoreExternalRefs: [], missingRequiredStoreExternalRefs: [], requiredProductSlugs: [], missingRequiredProductSlugs: [] });
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
      confidence: 0.88,
      observationId: 'observation-2',
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

  it('fails closed when the database reader returns no latest price rows', () => {
    assert.throws(() => buildDbSiteSnapshotArtifact({ generatedAt: '2026-05-22T21:20:00.000Z', rows: [] }), /No latest price rows available/);
  });
});
