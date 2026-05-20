import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDefaultFlyerSourcePlans, buildRetailerSourceRegistry, confidenceForSource, findRetailerSourceRegistryEntry, ingestRetailerProduct, normalizeUnitPrice, planFlyerSourceFetch, planIngestionBatch, planRetailerSourceAccess } from '../index.js';

describe('confidenceForSource', () => {
  it('uses proposal confidence values by source type', () => {
    assert.equal(confidenceForSource('official_api'), 0.95);
    assert.equal(confidenceForSource('retailer_online_page'), 0.85);
    assert.equal(confidenceForSource('receipt_scan'), 0.8);
    assert.equal(confidenceForSource('shelf_photo'), 0.75);
    assert.equal(confidenceForSource('flyer_campaign'), 0.7);
    assert.equal(confidenceForSource('manual_user_report'), 0.5);
    assert.equal(confidenceForSource('estimated'), 0.25);
  });
});

describe('normalizeUnitPrice', () => {
  it('normalizes package prices into comparable units', () => {
    assert.deepEqual(normalizeUnitPrice({ price: 49.9, packageSize: 450, packageUnit: 'g' }), { unitPrice: 110.8889, comparableUnit: 'kg' });
    assert.deepEqual(normalizeUnitPrice({ price: 14.9, packageSize: 1, packageUnit: 'l' }), { unitPrice: 14.9, comparableUnit: 'l' });
    assert.deepEqual(normalizeUnitPrice({ price: 34.9, packageSize: 12, packageUnit: 'piece' }), { unitPrice: 2.9083, comparableUnit: 'piece' });
  });
});

describe('ingestRetailerProduct', () => {
  it('creates product, alias, price observation, and promotion records from retailer input', () => {
    const output = ingestRetailerProduct({
      sourceType: 'retailer_online_page',
      observedAt: '2026-05-19T16:00:00.000Z',
      chainId: 'willys',
      storeId: 'willys-odenplan',
      retailerProductId: 'wil-zoegas-450',
      rawName: 'Zoégas Skånerost 450g',
      canonicalName: 'Zoégas Coffee 450g',
      productId: 'coffee-zoegas-450g',
      categoryId: 'coffee',
      brand: 'Zoégas',
      packageSize: 450,
      packageUnit: 'g',
      price: 49.9,
      regularPrice: 69.9,
      promoText: 'Veckans erbjudande',
      memberOnly: false,
      sourceUrl: 'https://example.test/coffee'
    });

    assert.equal(output.product.id, 'coffee-zoegas-450g');
    assert.equal(output.alias.matchConfidence, 0.85);
    assert.equal(output.priceObservation.unitPrice, 110.8889);
    assert.equal(output.priceObservation.confidenceScore, 0.85);
    assert.deepEqual(output.promotionObservation && {
      promoPrice: output.promotionObservation.promoPrice,
      regularPriceClaimed: output.promotionObservation.regularPriceClaimed,
      memberOnly: output.promotionObservation.memberOnly
    }, { promoPrice: 49.9, regularPriceClaimed: 69.9, memberOnly: false });
  });
});

describe('planIngestionBatch', () => {
  it('separates valid records from rejected records with reasons', () => {
    const plan = planIngestionBatch([
      { sourceType: 'manual_user_report', observedAt: '2026-05-19T16:00:00.000Z', chainId: 'coop', rawName: 'Milk', canonicalName: 'Milk 1L', productId: 'milk', categoryId: 'dairy', packageSize: 1, packageUnit: 'l', price: 14.9 },
      { sourceType: 'manual_user_report', observedAt: 'bad-date', chainId: 'coop', rawName: '', canonicalName: 'Bad', productId: 'bad', categoryId: 'dairy', packageSize: 0, packageUnit: 'l', price: -1 }
    ]);

    assert.equal(plan.accepted.length, 1);
    assert.equal(plan.rejected.length, 1);
    assert.match(plan.rejected[0].reason, /rawName is required/);
  });
});

describe('planRetailerSourceAccess', () => {
  it('allows official API access only with an active agreement and approved legal review', () => {
    const access = planRetailerSourceAccess({
      chainId: 'willys',
      sourceType: 'official_api',
      robotsTxtStatus: 'not_applicable',
      legalReviewStatus: 'approved',
      hasDataAgreement: true
    });

    assert.deepEqual(access, {
      status: 'allowed',
      chainId: 'willys',
      sourceType: 'official_api',
      reason: 'Official API access has legal approval and a data agreement.',
      requiredActions: []
    });
  });

  it('blocks retailer page crawling when robots or legal review are not approved', () => {
    const access = planRetailerSourceAccess({
      chainId: 'ica',
      sourceType: 'retailer_online_page',
      robotsTxtStatus: 'disallow',
      legalReviewStatus: 'pending',
      hasDataAgreement: false
    });

    assert.deepEqual(access, {
      status: 'blocked',
      chainId: 'ica',
      sourceType: 'retailer_online_page',
      reason: 'Retailer page ingestion requires robots.txt allow and approved legal review.',
      requiredActions: ['robots_txt_allow_required', 'legal_review_approval_required']
    });
  });
});

describe('buildRetailerSourceRegistry', () => {
  it('defines stub-only source policy for each researched Stockholm grocery chain', () => {
    const registry = buildRetailerSourceRegistry();

    assert.deepEqual(registry.map((entry) => entry.chainId), ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']);
    for (const entry of registry) {
      assert.equal(entry.stubOnly, true);
      assert.equal(entry.legalReviewStatus, 'pending');
      assert.ok(entry.surfaces.includes('store_locator'), `${entry.chainId} should define a store locator surface`);
      assert.ok(entry.sourceUrls.length > 0, `${entry.chainId} should include source URLs`);
      assert.match(entry.robotsPolicy.robotsUrl, /^https:\/\/www\./);
      assert.equal(entry.robotsPolicy.checkedAt, '2026-05-20T00:00:00.000Z');
    }
  });

  it('captures robots constraints for Axfood retailer pages without enabling live fetches', () => {
    const willys = findRetailerSourceRegistryEntry('willys');
    const hemkop = findRetailerSourceRegistryEntry('hemkop');
    const cityGross = findRetailerSourceRegistryEntry('city_gross');

    assert.equal(willys.robotsPolicy.crawlDelaySeconds, 10);
    assert.equal(willys.robotsPolicy.visitTimeUtc, '0400-0845');
    assert.ok(willys.robotsPolicy.disallowedPaths.includes('/varukorg'));
    assert.ok(hemkop.robotsPolicy.disallowedPaths.includes('/mina-sidor/'));
    assert.ok(cityGross.robotsPolicy.disallowedPaths.includes('/loop54/'));
    assert.equal(willys.stubOnly && hemkop.stubOnly && cityGross.stubOnly, true);
  });

  it('returns defensive copies so callers cannot mutate the source registry singleton', () => {
    const registry = buildRetailerSourceRegistry();
    registry[0].surfaces.length = 0;
    registry[0].robotsPolicy.disallowedPaths.push('/mutated');

    const ica = findRetailerSourceRegistryEntry('ica');

    assert.ok(ica.surfaces.includes('store_locator'));
    assert.equal(ica.robotsPolicy.disallowedPaths.includes('/mutated'), false);
  });
});

describe('planFlyerSourceFetch', () => {
  it('serializes all supported flyer source formats with provenance fields and no product facts', () => {
    const plans = buildDefaultFlyerSourcePlans('2026-05-20T06:00:00.000Z');

    assert.deepEqual(
      [...new Set(plans.map((plan) => plan.format))].sort(),
      ['app_offer', 'app_rendered_offer_html', 'digital_flyer', 'member_offer', 'store_offer_html', 'weekly_offer_html']
    );

    for (const plan of plans) {
      assert.match(plan.sourceUrl, /^https:\/\//);
      assert.ok(plan.sourceHost.length > 0);
      assert.equal(plan.retrievedAt, '2026-05-20T06:00:00.000Z');
      assert.equal(plan.rawSnapshotRef, null);
      assert.equal(plan.contentHash, null);
      assert.equal(plan.parserVersion, '0.1.0');
      assert.match(plan.robotsPolicy.robotsUrl, /^https:\/\/www\./);
      assert.equal(plan.legalReviewStatus, 'pending');
      assert.equal(plan.emitsProductFacts, false);
    }
  });

  it('carries chain-specific flyer constraints from the researched public surfaces', () => {
    const plans = buildDefaultFlyerSourcePlans('2026-05-20T06:00:00.000Z');
    const willys = plans.find((plan) => plan.chainId === 'willys' && plan.format === 'store_offer_html');
    const hemkop = plans.find((plan) => plan.chainId === 'hemkop' && plan.format === 'digital_flyer');
    const coop = plans.find((plan) => plan.chainId === 'coop');
    const cityGross = plans.find((plan) => plan.chainId === 'city_gross');

    assert.equal(willys?.requiresStoreSelection, true);
    assert.equal(willys?.robotsPolicy.crawlDelaySeconds, 10);
    assert.equal(willys?.robotsPolicy.visitTimeUtc, '0400-0845');
    assert.equal(hemkop?.robotsPolicy.crawlDelaySeconds, 10);
    assert.equal(coop?.sourceHost, 'dr.coop.se');
    assert.equal(coop?.retailerStoreKey, '105740');
    assert.equal(cityGross?.format, 'app_rendered_offer_html');
    assert.equal(cityGross?.emitsProductFacts, false);
  });

  it('marks member and app offer plans as authentication-bound stubs', () => {
    const lidlMember = planFlyerSourceFetch({
      chainId: 'lidl',
      sourceUrl: 'https://www.lidl.se/c/lidl-plus/s10017033',
      format: 'member_offer',
      retrievedAt: '2026-05-20T06:00:00.000Z',
      requiresAuthentication: true,
      memberOnly: true,
      rawSnapshotRef: 'raw/lidl-plus.html',
      contentHash: 'sha256:lidl'
    });

    assert.equal(lidlMember.requiresAuthentication, true);
    assert.equal(lidlMember.memberOnly, true);
    assert.equal(lidlMember.rawSnapshotRef, 'raw/lidl-plus.html');
    assert.equal(lidlMember.contentHash, 'sha256:lidl');
    assert.equal(lidlMember.emitsProductFacts, false);
  });
});
