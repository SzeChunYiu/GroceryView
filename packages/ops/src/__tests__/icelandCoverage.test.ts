import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIcelandCoverageReadinessReport,
  emptyIcelandCoverageReadinessInput,
  icelandCoverageThresholds
} from '../index.js';

describe('Iceland coverage readiness', () => {
  it('fails closed when no Iceland coverage evidence has been loaded', () => {
    const report = buildIcelandCoverageReadinessReport(emptyIcelandCoverageReadinessInput, {
      asOf: '2026-05-23T00:00:00.000Z'
    });

    assert.equal(report.market, 'IS');
    assert.equal(report.currency, 'ISK');
    assert.equal(report.status, 'blocked');
    assert.equal(report.publicClaimsAllowed, false);
    assert.equal(report.reykjavikClaimsAllowed, false);
    assert.equal(report.metrics.chainCount, 0);
    assert.equal(report.metrics.freshnessDays, null);
    assert.ok(report.blockers.includes('iceland_market_not_preview_ready'));
    assert.ok(report.blockers.includes('iceland_live_price_evidence_missing'));
    assert.ok(report.blockers.includes('iceland_freshness_evidence_missing'));
  });

  it('marks starter-basket-only coverage as preview and blocks public claims', () => {
    const report = buildIcelandCoverageReadinessReport({
      chains: ['bonus', 'kronan', 'netto', 'hagkaup'],
      cities: ['Reykjavik'],
      nationalRegions: [],
      storeCount: 0,
      reykjavikStoreCount: 0,
      productCount: 0,
      stapleProductCount: 0,
      categories: ['dairy', 'bread', 'produce', 'meat-fish', 'pantry', 'hygiene'],
      sources: [{ sourceId: 'iceland-starter-basket-taxonomy', sourceType: 'manual_taxonomy' }],
      starterBasketItemCount: icelandCoverageThresholds.preview.stapleProducts
    }, { asOf: '2026-05-23T00:00:00.000Z' });

    assert.equal(report.status, 'preview');
    assert.equal(report.previewReady, true);
    assert.equal(report.reykjavikReady, false);
    assert.equal(report.productionReady, false);
    assert.equal(report.publicClaimsAllowed, false);
    assert.equal(report.starterBasketOnly, true);
    assert.ok(report.blockers.includes('iceland_starter_basket_only'));
  });

  it('marks Reykjavik-ready coverage when live price, freshness, and source-mix gates pass', () => {
    const report = buildIcelandCoverageReadinessReport({
      chains: ['bonus', 'kronan', 'netto'],
      cities: ['Reykjavik'],
      nationalRegions: ['capital-region'],
      storeCount: icelandCoverageThresholds.reykjavik.stores,
      reykjavikStoreCount: icelandCoverageThresholds.reykjavik.reykjavikStores,
      productCount: icelandCoverageThresholds.reykjavik.products,
      stapleProductCount: icelandCoverageThresholds.reykjavik.stapleProducts,
      categories: Array.from({ length: icelandCoverageThresholds.reykjavik.categories }, (_, index) => `category-${index}`),
      sources: [
        {
          sourceId: 'bonus-is-public-storefront',
          sourceType: 'public_storefront',
          latestObservedAt: '2026-05-21T00:00:00.000Z',
          livePriceObservationCount: 300
        },
        {
          sourceId: 'kronan-is-flyer',
          sourceType: 'flyer_campaign',
          latestObservedAt: '2026-05-22T00:00:00.000Z',
          livePriceObservationCount: 250
        }
      ],
      latestObservedAt: '2026-05-22T00:00:00.000Z',
      starterBasketItemCount: icelandCoverageThresholds.preview.stapleProducts
    }, { asOf: '2026-05-23T00:00:00.000Z' });

    assert.equal(report.status, 'reykjavik_ready');
    assert.equal(report.reykjavikReady, true);
    assert.equal(report.productionReady, false);
    assert.equal(report.reykjavikClaimsAllowed, true);
    assert.equal(report.publicClaimsAllowed, false);
    assert.ok(report.blockers.some((blocker) => blocker.startsWith('iceland_nationalRegions_below_production_minimum')));
  });

  it('allows national production claims only when production coverage passes', () => {
    const report = buildIcelandCoverageReadinessReport({
      chains: ['bonus', 'kronan', 'netto', 'hagkaup'],
      cities: ['Reykjavik', 'Kopavogur', 'Akureyri', 'Reykjanesbaer', 'Selfoss'],
      nationalRegions: ['capital-region', 'south', 'north', 'west', 'reykjanes'],
      storeCount: icelandCoverageThresholds.production.stores,
      reykjavikStoreCount: icelandCoverageThresholds.production.reykjavikStores,
      productCount: icelandCoverageThresholds.production.products,
      stapleProductCount: icelandCoverageThresholds.production.stapleProducts,
      categories: Array.from({ length: icelandCoverageThresholds.production.categories }, (_, index) => `category-${index}`),
      sources: [
        {
          sourceId: 'bonus-is-public-storefront',
          sourceType: 'public_storefront',
          latestObservedAt: '2026-05-22T00:00:00.000Z',
          livePriceObservationCount: 700
        },
        {
          sourceId: 'kronan-is-flyer',
          sourceType: 'flyer_campaign',
          latestObservedAt: '2026-05-22T12:00:00.000Z',
          livePriceObservationCount: 500
        },
        {
          sourceId: 'hagkaup-is-public-storefront',
          sourceType: 'public_storefront',
          latestObservedAt: '2026-05-22T18:00:00.000Z',
          livePriceObservationCount: 350
        }
      ],
      latestObservedAt: '2026-05-22T18:00:00.000Z',
      starterBasketItemCount: icelandCoverageThresholds.preview.stapleProducts
    }, { asOf: '2026-05-23T00:00:00.000Z' });

    assert.equal(report.status, 'production_ready');
    assert.equal(report.publicClaimsAllowed, true);
    assert.equal(report.nationalClaimsAllowed, true);
    assert.deepEqual(report.blockers, []);
    assert.ok(report.gates.every((gate) => gate.productionPass));
  });
});
