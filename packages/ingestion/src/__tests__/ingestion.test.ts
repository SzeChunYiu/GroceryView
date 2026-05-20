import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertOfficialPriceIndexSource, buildDefaultFlyerSourcePlans, buildOfficialBaselineSourceRegistry, buildRetailerSourceRegistry, confidenceForSource, findRetailerSourceRegistryEntry, ingestRetailerProduct, normalizeUnitPrice, officialPriceIndexSources, planFlyerSourceFetch, planIngestionBatch, planRetailerSourceAccess } from '../index.js';
import {
  buildOpenPricesConnectorUrl,
  confidenceForSource,
  fetchRetailerConnectorSnapshot,
  ingestRetailerProduct,
  locatorFixturesCanAffectDealScore,
  normalizeUnitPrice,
  parseOpenPricesSnapshot,
  parseRetailerProductJsonSnapshot,
  planIngestionBatch,
  planRetailerSourceAccess,
  priceObservationIdentity
} from '../index.js';

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

  it('rejects duplicate price observations before downstream writes', () => {
    const first = {
      sourceType: 'retailer_online_page' as const,
      observedAt: '2026-05-19T16:00:00.000Z',
      chainId: 'willys',
      storeId: 'willys-odenplan',
      retailerProductId: 'wil-zoegas-450',
      rawName: 'Zoegas Skanerost 450g',
      canonicalName: 'Zoegas Coffee 450g',
      productId: 'coffee-zoegas-450g',
      categoryId: 'coffee',
      packageSize: 450,
      packageUnit: 'g',
      price: 49.9
    };
    const duplicate = { ...first, rawName: 'Zoegas Skanerost Coffee 450g', price: 52.9 };

    const plan = planIngestionBatch([first, duplicate]);

    assert.equal(plan.accepted.length, 1);
    assert.equal(plan.rejected.length, 1);
    assert.match(plan.rejected[0].reason, /Duplicate price observation/);
    assert.equal(plan.rejected[0].reason.includes(priceObservationIdentity(first)), true);
  });

  it('keeps same-product observations distinct by store scope', () => {
    const base = {
      sourceType: 'retailer_online_page' as const,
      observedAt: '2026-05-19T16:00:00.000Z',
      chainId: 'willys',
      retailerProductId: 'wil-zoegas-450',
      rawName: 'Zoegas Skanerost 450g',
      canonicalName: 'Zoegas Coffee 450g',
      productId: 'coffee-zoegas-450g',
      categoryId: 'coffee',
      packageSize: 450,
      packageUnit: 'g',
      price: 49.9
    };

    const plan = planIngestionBatch([
      { ...base, storeId: 'willys-odenplan' },
      { ...base, storeId: 'willys-sodermalm' }
    ]);

    assert.equal(plan.accepted.length, 2);
    assert.equal(plan.rejected.length, 0);
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

    assert.equal(plan.status, 'blocked');
    assert.deepEqual(plan.requiredActions, ['robots_txt_allow_required', 'legal_review_approval_required']);
  });

  it('marks already-seen connector run keys as duplicates', () => {
    const plan = planRetailerConnectorRun({
      connectorId: 'coop-flyer',
      requestedAt: '2026-05-19T18:00:00.000Z',
      chainId: 'coop',
      sourceType: 'flyer_campaign',
      robotsTxtStatus: 'not_applicable',
      legalReviewStatus: 'approved',
      hasDataAgreement: false,
      parserVersion: 'coop-flyer-v1',
      previousRunKeys: ['coop:flyer-campaign:coop-flyer:2026-05-19']
    });

    assert.equal(plan.status, 'duplicate');
    assert.deepEqual(plan.requiredActions, ['skip_duplicate_connector_run']);
  });
});


describe('runRetailerConnector', () => {
  it('fetches a ready connector, stamps provenance, and ingests parsed products', async () => {
    const result = await runRetailerConnector({
      connectorId: 'Willys API v1',
      requestedAt: '2026-05-19T18:00:00.000Z',
      chainId: 'willys',
      sourceType: 'official_api',
      robotsTxtStatus: 'not_applicable',
      legalReviewStatus: 'approved',
      hasDataAgreement: true,
      endpointUrl: 'https://api.example.test/willys/products',
      parserVersion: 'willys-api-v1',
      fetcher: async (plan) => ({
        statusCode: 200,
        body: '{"items":[{"id":"wil-zoegas-450"}]}',
        contentType: 'application/json',
        retrievedAt: plan.provenance.capturedAt,
        sourceUrl: plan.provenance.sourceUrl,
        rawSnapshotRef: `s3://groceryview-raw/${plan.runKey}.json`
      }),
      parser: (snapshot) => {
        assert.equal(snapshot.statusCode, 200);
        assert.equal(snapshot.contentHash?.startsWith('sha256:'), true);
        assert.equal(snapshot.rawSnapshotRef, 's3://groceryview-raw/willys:official-api:willys-api-v1:2026-05-19.json');
        return [{
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
          promoText: 'Veckans erbjudande'
        }];
      }
    });

    assert.equal(result.status, 'completed');
    assert.equal(result.fetchAttempted, true);
    assert.equal(result.parserAttempted, true);
    assert.equal(result.acceptedCount, 1);
    assert.equal(result.rejectedCount, 0);
    assert.deepEqual(result.requiredActions, []);
    assert.equal(result.ingestion.accepted[0].priceObservation.sourceRunId, 'source-run:willys:official-api:willys-api-v1:2026-05-19');
    assert.deepEqual(result.ingestion.accepted[0].priceObservation.provenance, {
      sourceType: 'official_api',
      sourceUrl: 'https://api.example.test/willys/products',
      observedAt: '2026-05-19T18:00:00.000Z',
      parserVersion: 'willys-api-v1',
      rawSnapshotRef: 's3://groceryview-raw/willys:official-api:willys-api-v1:2026-05-19.json',
      sourceRunId: 'source-run:willys:official-api:willys-api-v1:2026-05-19'
    });
  });

  it('does not fetch when source access gates block the connector', async () => {
    const result = await runRetailerConnector({
      connectorId: 'ica-page',
      requestedAt: '2026-05-19T18:00:00.000Z',
      chainId: 'ica',
      sourceType: 'retailer_online_page',
      robotsTxtStatus: 'unknown',
      legalReviewStatus: 'pending',
      hasDataAgreement: false,
      endpointUrl: 'https://example.test/ica',
      parserVersion: 'ica-page-v1',
      fetcher: () => { throw new Error('fetcher should not be called'); },
      parser: () => { throw new Error('parser should not be called'); }
    });

    assert.equal(result.status, 'blocked');
    assert.equal(result.fetchAttempted, false);
    assert.equal(result.parserAttempted, false);
    assert.deepEqual(result.requiredActions, ['robots_txt_allow_required', 'legal_review_approval_required']);
  });

  it('fails closed when the connector fetch returns a non-success response', async () => {
    const result = await runRetailerConnector({
      connectorId: 'Coop flyer',
      requestedAt: '2026-05-19T18:00:00.000Z',
      chainId: 'coop',
      sourceType: 'flyer_campaign',
      robotsTxtStatus: 'not_applicable',
      legalReviewStatus: 'approved',
      hasDataAgreement: false,
      endpointUrl: 'https://example.test/coop/flyer',
      parserVersion: 'coop-flyer-v1',
      fetcher: () => ({
        statusCode: 503,
        body: 'unavailable',
        rawSnapshotRef: 's3://groceryview-raw/coop-flyer-error.html'
      }),
      parser: () => []
    });

    assert.equal(result.status, 'failed');
    assert.equal(result.fetchAttempted, true);
    assert.equal(result.parserAttempted, false);
    assert.deepEqual(result.requiredActions, ['investigate_connector_run_failure']);
    assert.match(result.error ?? '', /HTTP 503/);
  });
});

describe('fetchRetailerConnectorSnapshot', () => {
  it('uses a provided fetch implementation to produce a content-addressed raw snapshot', async () => {
    const plan = planRetailerConnectorRun({
      connectorId: 'Willys API v1',
      requestedAt: '2026-05-19T18:00:00.000Z',
      chainId: 'willys',
      sourceType: 'official_api',
      robotsTxtStatus: 'not_applicable',
      legalReviewStatus: 'approved',
      hasDataAgreement: true,
      endpointUrl: 'https://api.example.test/willys/products',
      parserVersion: 'willys-api-v1'
    });

    const snapshot = await fetchRetailerConnectorSnapshot(plan, {
      retrievedAt: '2026-05-19T18:01:00.000Z',
      rawSnapshotRefPrefix: 'raw://test-snapshots',
      fetchImpl: async (url, init) => {
        assert.equal(url, 'https://api.example.test/willys/products');
        assert.deepEqual(init?.headers, { accept: 'application/json' });
        return {
          status: 200,
          headers: { get: (name: string) => name === 'content-type' ? 'application/json' : null },
          text: async () => '{"items":[]}'
        };
      },
      headers: { accept: 'application/json' }
    });

    assert.equal(snapshot.statusCode, 200);
    assert.equal(snapshot.body, '{"items":[]}');
    assert.equal(snapshot.contentType, 'application/json');
    assert.equal(snapshot.retrievedAt, '2026-05-19T18:01:00.000Z');
    assert.equal(snapshot.sourceUrl, 'https://api.example.test/willys/products');
    assert.equal(snapshot.contentHash?.startsWith('sha256:'), true);
    assert.match(snapshot.rawSnapshotRef, /^raw:\/\/test-snapshots\/source-run-willys-official-api-willys-api-v1-2026-05-19\/sha256-/);
  });
});


describe('parseRetailerProductJsonSnapshot', () => {
  it('parses provider-neutral product JSON and works as a connector runner parser', async () => {
    const result = await runRetailerConnector({
      connectorId: 'Willys normalized JSON',
      requestedAt: '2026-05-20T08:40:00.000Z',
      chainId: 'willys',
      sourceType: 'official_api',
      robotsTxtStatus: 'not_applicable',
      legalReviewStatus: 'approved',
      hasDataAgreement: true,
      endpointUrl: 'https://api.example.test/willys/normalized-products',
      parserVersion: 'normalized-json-v1',
      fetcher: (plan) => ({
        statusCode: 200,
        body: JSON.stringify({
          items: [{
            storeId: 'willys-odenplan',
            retailerProductId: 'wil-zoegas-450',
            rawName: 'Zoégas Skånerost 450g',
            canonicalName: 'Zoégas Coffee 450g',
            productId: 'coffee-zoegas-450g',
            categoryId: 'coffee',
            brand: 'Zoégas',
            packageSize: '450',
            packageUnit: 'g',
            price: '49.90',
            regularPrice: 69.9,
            promoText: 'Veckans erbjudande',
            memberOnly: 'false'
          }]
        }),
        contentType: 'application/json',
        retrievedAt: plan.provenance.capturedAt,
        sourceUrl: plan.provenance.sourceUrl,
        rawSnapshotRef: `raw://normalized/${plan.runKey}.json`
      }),
      parser: parseRetailerProductJsonSnapshot
    });

    assert.equal(result.status, 'completed');
    assert.equal(result.acceptedCount, 1);
    assert.equal(result.ingestion.accepted[0].priceObservation.unitPrice, 110.8889);
    assert.equal(result.ingestion.accepted[0].priceObservation.parserVersion, 'normalized-json-v1');
    assert.equal(result.ingestion.accepted[0].priceObservation.rawSnapshotRef, 'raw://normalized/willys:official-api:willys-normalized-json:2026-05-20.json');
  });

  it('rejects malformed or incomplete normalized JSON before ingestion', () => {
    assert.throws(() => parseRetailerProductJsonSnapshot({
      statusCode: 200,
      body: '{bad json',
      contentType: 'application/json',
      retrievedAt: '2026-05-20T08:40:00.000Z',
      sourceUrl: 'https://api.example.test/bad',
      rawSnapshotRef: 'raw://bad',
      contentHash: 'sha256:bad'
    }), /valid JSON/);

    assert.throws(() => parseRetailerProductJsonSnapshot({
      statusCode: 200,
      body: JSON.stringify({ items: [{ rawName: 'Missing fields' }] }),
      contentType: 'application/json',
      retrievedAt: '2026-05-20T08:40:00.000Z',
      sourceUrl: 'https://api.example.test/bad',
      rawSnapshotRef: 'raw://bad',
      contentHash: 'sha256:bad'
    }), /items\[0\]\.canonicalName/);
  });
});

describe('Open Prices real-data connector', () => {
  it('builds a compliant Sweden SEK Open Prices URL for bounded public pulls', () => {
    assert.equal(
      buildOpenPricesConnectorUrl({ currency: 'SEK', countryCode: 'SE', size: 5 }),
      'https://prices.openfoodfacts.org/api/v1/prices?currency=SEK&size=5&location__osm_address_country_code=SE&order_by=-date'
    );
  });

  it('normalizes Open Prices API rows into ingestion-ready price observations', async () => {
    const result = await runRetailerConnector({
      connectorId: 'open-prices-public-api',
      requestedAt: '2026-05-20T10:15:00.000Z',
      chainId: 'open_prices',
      sourceType: 'official_api',
      robotsTxtStatus: 'not_applicable',
      legalReviewStatus: 'approved',
      hasDataAgreement: true,
      endpointUrl: buildOpenPricesConnectorUrl({ currency: 'SEK', countryCode: 'SE', size: 2 }),
      parserVersion: 'open-prices-v1',
      fetcher: (plan) => ({
        statusCode: 200,
        contentType: 'application/json',
        retrievedAt: '2026-05-20T10:15:03.000Z',
        sourceUrl: plan.provenance.sourceUrl,
        rawSnapshotRef: `raw://open-prices/${plan.runKey}.json`,
        body: JSON.stringify({
          total: 1,
          items: [{
            id: 31101,
            product_code: '7311312007100',
            product_name: null,
            price: 34.9,
            price_is_discounted: true,
            price_without_discount: 39.9,
            currency: 'SEK',
            date: '2024-07-28',
            product: {
              code: '7311312007100',
              product_name: 'Crunchy granola äpple & kanel',
              brands: 'Risenta',
              product_quantity: 375,
              product_quantity_unit: 'g',
              categories_tags: ['en:breakfast-cereals', 'en:mueslis']
            },
            location: {
              id: 1,
              osm_brand: 'Lidl',
              osm_name: 'Lidl',
              osm_address_city: 'Landskrona kommun',
              osm_address_country_code: 'SE'
            }
          }]
        })
      }),
      parser: parseOpenPricesSnapshot
    });

    assert.equal(result.status, 'completed');
    assert.equal(result.acceptedCount, 1);
    assert.equal(result.rejectedCount, 0);
    assert.deepEqual(result.requiredActions, []);
    assert.equal(result.ingestion.accepted[0].product.id, 'off-7311312007100');
    assert.equal(result.ingestion.accepted[0].product.canonicalName, 'Crunchy granola äpple & kanel');
    assert.equal(result.ingestion.accepted[0].product.categoryId, 'mueslis');
    assert.equal(result.ingestion.accepted[0].product.packageSize, 375);
    assert.equal(result.ingestion.accepted[0].product.packageUnit, 'g');
    assert.equal(result.ingestion.accepted[0].priceObservation.chainId, 'lidl');
    assert.equal(result.ingestion.accepted[0].priceObservation.retailerProductId, 'open-prices-price-31101');
    assert.equal(result.ingestion.accepted[0].priceObservation.storeId, 'open-prices-location-1');
    assert.equal(result.ingestion.accepted[0].priceObservation.observedAt, '2024-07-28T00:00:00.000Z');
    assert.equal(result.ingestion.accepted[0].priceObservation.price, 34.9);
    assert.equal(result.ingestion.accepted[0].priceObservation.regularPrice, 39.9);
    assert.equal(result.ingestion.accepted[0].priceObservation.unitPrice, 93.0667);
    assert.equal(result.ingestion.accepted[0].promotionObservation?.promoText, 'Open Prices discounted price');
  });

  it('fails closed when an Open Prices snapshot has no usable SEK product price rows', () => {
    assert.throws(() => parseOpenPricesSnapshot({
      statusCode: 200,
      body: JSON.stringify({ items: [{ id: 1, currency: 'EUR', price: 2.5, product: {} }] }),
      contentType: 'application/json',
      retrievedAt: '2026-05-20T10:15:03.000Z',
      sourceUrl: 'https://prices.openfoodfacts.org/api/v1/prices?currency=SEK',
      rawSnapshotRef: 'raw://open-prices/empty',
      contentHash: 'sha256:empty'
    }), /no usable SEK product price rows/);
  });
});
