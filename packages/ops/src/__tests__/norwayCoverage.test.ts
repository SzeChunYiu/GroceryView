import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNorwayCoverageReadinessReport,
  emptyNorwayCoverageReadinessInput,
  norwayCoverageThresholds
} from '../index.js';

describe('Norway coverage readiness', () => {
  it('fails closed when no Norway coverage evidence has been loaded', () => {
    const report = buildNorwayCoverageReadinessReport(emptyNorwayCoverageReadinessInput, {
      asOf: '2026-05-23T00:00:00.000Z'
    });

    assert.equal(report.market, 'NO');
    assert.equal(report.currency, 'NOK');
    assert.equal(report.status, 'blocked');
    assert.equal(report.publicClaimsAllowed, false);
    assert.equal(report.metrics.chainCount, 0);
    assert.equal(report.metrics.freshnessDays, null);
    assert.ok(report.blockers.includes('norway_market_not_demo_ready'));
    assert.ok(report.blockers.includes('norway_freshness_evidence_missing'));
    assert.match(report.guardrails.join(' '), /public price claims stay disabled/);
  });

  it('marks demo-ready coverage as operator-only and keeps public claims blocked', () => {
    const report = buildNorwayCoverageReadinessReport({
      chains: ['kiwi', 'rema-1000'],
      cities: ['Oslo', 'Bergen'],
      storeCount: norwayCoverageThresholds.demo.stores,
      productCount: norwayCoverageThresholds.demo.products,
      categories: Array.from({ length: norwayCoverageThresholds.demo.categories }, (_, index) => `category-${index}`),
      sourceIds: ['kassalapp'],
      latestObservedAt: '2026-05-20T00:00:00.000Z'
    }, { asOf: '2026-05-23T00:00:00.000Z' });

    assert.equal(report.status, 'demo_ready');
    assert.equal(report.demoReady, true);
    assert.equal(report.productionReady, false);
    assert.equal(report.publicClaimsAllowed, false);
    assert.ok(report.blockers.some((blocker) => blocker.startsWith('norway_chains_below_production_minimum')));
    assert.equal(report.metrics.freshnessDays, 3);
  });

  it('allows production claims only when production coverage and freshness thresholds pass', () => {
    const report = buildNorwayCoverageReadinessReport({
      chains: ['kiwi', 'rema-1000', 'meny', 'coop-no'],
      cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromsø'],
      storeCount: norwayCoverageThresholds.production.stores,
      productCount: norwayCoverageThresholds.production.products,
      categories: Array.from({ length: norwayCoverageThresholds.production.categories }, (_, index) => `category-${index}`),
      sourceIds: ['kassalapp', 'mattilbud'],
      latestObservedAt: '2026-05-22T00:00:00.000Z'
    }, { asOf: '2026-05-23T00:00:00.000Z' });

    assert.equal(report.status, 'production_ready');
    assert.equal(report.publicClaimsAllowed, true);
    assert.deepEqual(report.blockers, []);
    assert.ok(report.gates.every((gate) => gate.productionPass));
  });
});
