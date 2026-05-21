import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import {
  buildOpenFoodFactsProductUrl,
  buildOpenPricesConnectorUrl,
  cacheKeyForScbPxWebQueryFixture,
  cellCountForScbPxWebQueryFixture,
  confidenceForSource,
  buildWillysSearchUrl,
  fetchOpenFoodFactsExportProducts,
  fetchOpenFoodFactsProducts,
  fetchOverpassGroceryStores,
  fetchRetailerConnectorSnapshot,
  fetchWillysProducts,
  groceryCategoryCoicopMappings,
  groceryCategoryCoicopMappingsCanEmitStorePrices,
  ingestRetailerProduct,
  locatorFixturesCanAffectDealScore,
  normalizeUnitPrice,
  offerSelectorFixtures,
  offerSelectorFixturesCanEmitOfferFacts,
  parseOpenPricesSnapshot,
  parseRetailerProductJsonSnapshot,
  planIngestionBatch,
  planOfferVisibilityBoundary,
  planRetailerConnectorRun,
  planRetailerSourceAccess,
  planRetailerSurfacePolicy,
  offerVisibilityBoundaryPlans,
  OPENFOODFACTS_EXPORT_URL,
  OVERPASS_INTERPRETER_URL,
  parseOverpassGroceryStores,
  retailerRobotsPolicyMatrix,
  runRetailerConnector,
  stockholmStoreLocatorFixtures,
  validateOfferSelectorFixtures,
  validateGroceryCategoryCoicopMappings,
  scbCoicopFoodCategoryCodes,
  scbPxWebQueryFixtures,
  validateScbPxWebQueryFixtures,
  validateStoreLocatorFixtures
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

describe('fetchOpenFoodFactsProducts', () => {
  it('fetches product rows from the public product API with provenance', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      return new Response(JSON.stringify({
        status: 1,
        product: {
          code: '7340083494406',
          product_name: 'Havredryck choklad',
          brands: 'Eldorado',
          quantity: '1 l',
          categories_tags: ['en:beverages', 'en:dairy-substitutes'],
          labels_tags: ['en:vegan'],
          nutriscore_grade: 'd',
          image_front_url: 'https://images.openfoodfacts.org/images/products/734/008/349/4406/front_sv.11.400.jpg',
          url: 'https://world.openfoodfacts.org/product/7340083494406/havredryck-choklad-eldorado'
        }
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchOpenFoodFactsProducts({
      codes: ['7340083494406'],
      fetchImpl,
      retrievedAt: '2026-05-20T23:29:26.000Z'
    });

    assert.equal(requestedUrls[0], buildOpenFoodFactsProductUrl('7340083494406'));
    assert.deepEqual(rows, [{
      code: '7340083494406',
      name: 'Havredryck choklad',
      brands: 'Eldorado',
      quantity: '1 l',
      categories: ['en:beverages', 'en:dairy-substitutes'],
      labels: ['en:vegan'],
      nutriscoreGrade: 'd',
      imageUrl: 'https://images.openfoodfacts.org/images/products/734/008/349/4406/front_sv.11.400.jpg',
      productUrl: 'https://world.openfoodfacts.org/product/7340083494406/havredryck-choklad-eldorado',
      sourceUrl: buildOpenFoodFactsProductUrl('7340083494406'),
      retrievedAt: '2026-05-20T23:29:26.000Z'
    }]);
  });
});

describe('fetchOpenFoodFactsExportProducts', () => {
  it('streams real product rows from the official OpenFoodFacts TSV export', async () => {
    const tsv = [
      'code\turl\tproduct_name\tquantity\tbrands\tcategories_tags\tlabels_tags\tnutriscore_grade\timage_url',
      '7340083494406\thttps://world.openfoodfacts.org/product/7340083494406/havredryck-choklad-eldorado\tHavredryck choklad\t1 l\tEldorado\ten:beverages,en:dairy-substitutes\ten:vegan\td\thttps://images.openfoodfacts.org/images/products/734/008/349/4406/front_sv.11.400.jpg'
    ].join('\n');
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      return new Response(gzipSync(tsv), { status: 200, headers: { 'content-type': 'application/gzip' } });
    };

    const rows = await fetchOpenFoodFactsExportProducts({
      codes: ['7340083494406'],
      fetchImpl,
      maxRows: 1,
      retrievedAt: '2026-05-20T23:32:06.000Z'
    });

    assert.equal(requestedUrls[0], OPENFOODFACTS_EXPORT_URL);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].code, '7340083494406');
    assert.equal(rows[0].name, 'Havredryck choklad');
    assert.deepEqual(rows[0].categories, ['en:beverages', 'en:dairy-substitutes']);
    assert.equal(rows[0].sourceUrl, `${OPENFOODFACTS_EXPORT_URL}#code=7340083494406`);
  });
});

describe('fetchOverpassGroceryStores', () => {
  it('posts a public Overpass query and preserves OSM store provenance', async () => {
    const requestedBodies: string[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      assert.equal(String(url), OVERPASS_INTERPRETER_URL);
      assert.equal(init?.method, 'POST');
      requestedBodies.push(String(init?.body));
      return new Response(JSON.stringify({
        elements: [{
          type: 'node',
          id: 29898149,
          lat: 59.337217,
          lon: 18.0911217,
          tags: {
            shop: 'supermarket',
            name: 'ICA nära Karlaplan',
            brand: 'ICA Nära',
            'contact:website': 'https://www.ica.se/butiker/nara/stockholm/ica-karlaplan-1003714/',
            'contact:phone': '+4686624035',
            opening_hours: 'Mo-Fr 07:00-23:00; Sa-Su 08:00-23:00'
          }
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchOverpassGroceryStores({
      fetchImpl,
      retrievedAt: '2026-05-20T23:45:00.000Z'
    });

    assert.match(requestedBodies[0], /shop/);
    assert.deepEqual(rows, [{
      osmType: 'node',
      osmId: 29898149,
      name: 'ICA nära Karlaplan',
      brand: 'ICA Nära',
      shop: 'supermarket',
      latitude: 59.337217,
      longitude: 18.0911217,
      street: '',
      houseNumber: '',
      postcode: '',
      city: '',
      openingHours: 'Mo-Fr 07:00-23:00; Sa-Su 08:00-23:00',
      website: 'https://www.ica.se/butiker/nara/stockholm/ica-karlaplan-1003714/',
      phone: '+4686624035',
      sourceUrl: OVERPASS_INTERPRETER_URL,
      retrievedAt: '2026-05-20T23:45:00.000Z'
    }]);
  });

  it('drops Overpass elements that do not have coordinates or a shop name', () => {
    const rows = parseOverpassGroceryStores({
      elements: [
        { type: 'node', id: 1, lat: 59, lon: 18, tags: { shop: 'supermarket', name: 'Valid' } },
        { type: 'node', id: 2, tags: { shop: 'supermarket', name: 'Missing coordinates' } },
        { type: 'node', id: 3, lat: 59, lon: 18, tags: { shop: 'supermarket' } }
      ]
    }, '2026-05-20T23:45:00.000Z');

    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, 'Valid');
  });
});

describe('fetchWillysProducts', () => {
  it('fetches public Willys search rows with price provenance', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      return new Response(JSON.stringify({
        results: [{
          code: '101205621_ST',
          name: 'Idealmakaroner Gammaldags',
          manufacturer: 'Kungsörnen',
          productLine2: 'KUNGSÖRNEN, 750g',
          googleAnalyticsCategory: 'skafferi|pasta',
          priceValue: 12.2,
          price: '12,20 kr',
          comparePrice: '16,27 kr',
          comparePriceUnit: 'kg',
          image: { url: 'https://assets.axfood.se/image/upload/f_auto,t_200/07310130003547_C1R1_s03' },
          labels: ['keyhole'],
          online: true,
          outOfStock: false
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchWillysProducts({
      queries: ['makaroner'],
      fetchImpl,
      retrievedAt: '2026-05-21T00:00:00.000Z'
    });

    assert.equal(requestedUrls[0], buildWillysSearchUrl('makaroner'));
    assert.deepEqual(rows, [{
      code: '101205621_ST',
      name: 'Idealmakaroner Gammaldags',
      brand: 'Kungsörnen',
      packageText: 'KUNGSÖRNEN, 750g',
      category: 'skafferi|pasta',
      price: 12.2,
      priceText: '12,20 kr',
      unitPriceText: '16,27 kr',
      unitPriceUnit: 'kg',
      imageUrl: 'https://assets.axfood.se/image/upload/f_auto,t_200/07310130003547_C1R1_s03',
      labels: ['keyhole'],
      online: true,
      outOfStock: false,
      sourceUrl: buildWillysSearchUrl('makaroner'),
      retrievedAt: '2026-05-21T00:00:00.000Z'
    }]);
  });

  it('deduplicates products across Willys search queries', async () => {
    const fetchImpl: typeof fetch = async () => new Response(JSON.stringify({
      results: [{
        code: 'duplicate',
        name: 'Same product',
        priceValue: 10,
        price: '10,00 kr'
      }]
    }), { status: 200 });

    const rows = await fetchWillysProducts({
      queries: ['a', 'b'],
      fetchImpl,
      retrievedAt: '2026-05-21T00:00:00.000Z'
    });

    assert.equal(rows.length, 1);
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
      parserVersion: 'retailer-page-parser-v1',
      rawSnapshotRef: 's3://groceryview-raw/willys/coffee-2026-05-19.json',
      sourceRunId: 'source-run-2026-05-19',
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
    assert.equal(output.priceObservation.priceType, 'online');
    assert.deepEqual(output.priceObservation.provenance, {
      sourceType: 'retailer_online_page',
      sourceUrl: 'https://example.test/coffee',
      observedAt: '2026-05-19T16:00:00.000Z',
      parserVersion: 'retailer-page-parser-v1',
      rawSnapshotRef: 's3://groceryview-raw/willys/coffee-2026-05-19.json',
      sourceRunId: 'source-run-2026-05-19'
    });
    assert.deepEqual(output.promotionObservation && {
      promoPrice: output.promotionObservation.promoPrice,
      regularPriceClaimed: output.promotionObservation.regularPriceClaimed,
      memberOnly: output.promotionObservation.memberOnly,
      priceType: output.promotionObservation.priceType,
      provenance: output.promotionObservation.provenance
    }, {
      promoPrice: 49.9,
      regularPriceClaimed: 69.9,
      memberOnly: false,
      priceType: 'online',
      provenance: output.priceObservation.provenance
    });
  });

  it('rejects records that cannot preserve parser and raw snapshot provenance', () => {
    assert.throws(() => ingestRetailerProduct({
      sourceType: 'manual_user_report',
      observedAt: '2026-05-19T16:00:00.000Z',
      parserVersion: '',
      rawSnapshotRef: '',
      chainId: 'coop',
      rawName: 'Milk',
      canonicalName: 'Milk 1L',
      productId: 'milk',
      categoryId: 'dairy',
      packageSize: 1,
      packageUnit: 'l',
      price: 14.9
    }), /parserVersion is required/);
  });
});

describe('planIngestionBatch', () => {
  it('separates valid records from rejected records with reasons', () => {
    const plan = planIngestionBatch([
      { sourceType: 'manual_user_report', observedAt: '2026-05-19T16:00:00.000Z', parserVersion: 'manual-v1', rawSnapshotRef: 'manual://milk', chainId: 'coop', rawName: 'Milk', canonicalName: 'Milk 1L', productId: 'milk', categoryId: 'dairy', packageSize: 1, packageUnit: 'l', price: 14.9 },
      { sourceType: 'manual_user_report', observedAt: 'bad-date', parserVersion: 'manual-v1', rawSnapshotRef: 'manual://bad', chainId: 'coop', rawName: '', canonicalName: 'Bad', productId: 'bad', categoryId: 'dairy', packageSize: 0, packageUnit: 'l', price: -1 }
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

describe('planRetailerSurfacePolicy', () => {
  it('covers every target retailer and required source-policy surface', () => {
    const chains = ['city_gross', 'coop', 'hemkop', 'ica', 'lidl', 'willys'] as const;
    const surfaces = ['store_locator', 'offer', 'product', 'search', 'basket', 'account', 'member', 'app_api'] as const;

    assert.equal(retailerRobotsPolicyMatrix.length, chains.length * surfaces.length);
    for (const chainId of chains) {
      for (const surface of surfaces) {
        const plan = planRetailerSurfacePolicy({ chainId, surface });
        assert.equal(plan.chainId, chainId);
        assert.equal(plan.surface, surface);
        assert.match(plan.robotsUrl, /^https:\/\/www\..+\/robots\.txt$/);
        assert.equal(Number.isNaN(Date.parse(plan.checkedAt)), false);
      }
    }
  });

  it('fails closed for blocked account, basket, member, and search surfaces', () => {
    for (const chainId of ['city_gross', 'coop', 'hemkop', 'ica', 'lidl', 'willys'] as const) {
      for (const surface of ['account', 'basket', 'member'] as const) {
        const plan = planRetailerSurfacePolicy({ chainId, surface });
        assert.equal(plan.policy, 'blocked');
        assert.equal(plan.canFetch, false);
        assert.ok(plan.requiredActions.includes('source_surface_blocked'));
      }
    }

    for (const chainId of ['city_gross', 'coop', 'hemkop', 'lidl', 'willys'] as const) {
      const plan = planRetailerSurfacePolicy({ chainId, surface: 'search' });
      assert.equal(plan.policy, 'blocked');
      assert.equal(plan.canFetch, false);
      assert.ok(plan.disallowedPathMatches.length > 0);
    }
  });

  it('preserves crawl-delay metadata for crawl-delay retailers', () => {
    for (const chainId of ['hemkop', 'willys'] as const) {
      const plan = planRetailerSurfacePolicy({ chainId, surface: 'store_locator' });
      assert.equal(plan.policy, 'fixture_review');
      assert.equal(plan.canFetch, false);
      assert.equal(plan.crawlDelaySeconds, 10);
      assert.ok(plan.requiredActions.includes('crawl_delay_10s_required'));
    }
  });

  it('keeps app and API surfaces stub-only with no network fetch', () => {
    for (const chainId of ['city_gross', 'coop', 'hemkop', 'ica', 'lidl', 'willys'] as const) {
      const plan = planRetailerSurfacePolicy({ chainId, surface: 'app_api' });
      assert.equal(plan.policy, 'stub_only');
      assert.equal(plan.canFetch, false);
      assert.deepEqual(plan.disallowedPathMatches, []);
      assert.ok(plan.requiredActions.includes('stub_only_no_network_fetch'));
    }
  });
});

describe('planOfferVisibilityBoundary', () => {
  it('defines every offer visibility boundary with a default source-policy decision', () => {
    const expected = ['public_weekly', 'public_member_price', 'authenticated_member', 'personalized_coupon', 'private_wallet'] as const;

    assert.deepEqual(offerVisibilityBoundaryPlans.map((plan) => plan.visibility), [...expected]);
    for (const visibility of expected) {
      const plan = planOfferVisibilityBoundary(visibility);
      assert.equal(plan.visibility, visibility);
      assert.ok(['fixture_review', 'stub_only'].includes(plan.defaultPolicy));
      assert.equal(plan.canFetch, false);
    }
  });

  it('requires loyalty eligibility labels for public member prices', () => {
    const weekly = planOfferVisibilityBoundary('public_weekly');
    const memberPrice = planOfferVisibilityBoundary('public_member_price');

    assert.equal(weekly.requiredEligibilityLabel, 'none');
    assert.equal(weekly.canEmitPublicCoverage, true);
    assert.equal(weekly.canAffectDefaultDealScore, true);
    assert.equal(memberPrice.requiredEligibilityLabel, 'requires_loyalty_membership');
    assert.equal(memberPrice.canEmitPublicCoverage, true);
    assert.equal(memberPrice.canAffectDefaultDealScore, true);
    assert.ok(memberPrice.requiredActions.includes('loyalty_eligibility_label_required'));
  });

  it('keeps authenticated, personalized, and private wallet offers stub-only', () => {
    for (const visibility of ['authenticated_member', 'personalized_coupon', 'private_wallet'] as const) {
      const plan = planOfferVisibilityBoundary(visibility);
      assert.equal(plan.defaultPolicy, 'stub_only');
      assert.equal(plan.canFetch, false);
      assert.equal(plan.canEmitPublicCoverage, false);
      assert.equal(plan.canAffectDefaultDealScore, false);
      assert.ok(plan.requiredActions.includes('stub_only_no_network_fetch'));
      assert.notEqual(plan.requiredEligibilityLabel, 'none');
    }
  });
});

describe('store locator fixtures', () => {
  it('covers every target Stockholm chain with immutable raw snapshot provenance', () => {
    const validation = validateStoreLocatorFixtures(stockholmStoreLocatorFixtures);

    assert.deepEqual(validation, {
      status: 'valid',
      chainIds: ['city_gross', 'coop', 'hemkop', 'ica', 'lidl', 'willys'],
      issues: []
    });
    assert.equal(stockholmStoreLocatorFixtures.length, 6);
    for (const fixture of stockholmStoreLocatorFixtures) {
      assert.match(fixture.sourceUrl, /^https:\/\//);
      assert.match(fixture.rawSnapshotRef, /^fixtures\/store-locators\//);
      assert.match(fixture.contentDigest, /^sha256:/);
      assert.equal(Number.isNaN(Date.parse(fixture.capturedAt)), false);
    }
  });

  it('makes unresolved identifiers, missing hours, and special-hour gaps explicit', () => {
    const unresolved = stockholmStoreLocatorFixtures.filter((fixture) => fixture.storeIdentifierStatus !== 'resolved');

    assert.ok(unresolved.length > 0);
    for (const fixture of unresolved) {
      assert.ok(fixture.confidenceReasons.includes('identifier_unresolved'));
    }
    for (const fixture of stockholmStoreLocatorFixtures.filter((fixture) => fixture.openingHours.length === 0)) {
      assert.ok(fixture.confidenceReasons.includes('hours_missing'));
      assert.ok(fixture.confidenceReasons.includes('special_hours_unknown'));
      assert.equal(fixture.specialHoursUnknown, true);
    }
  });

  it('keeps locator coverage out of default Deal Score ranking', () => {
    assert.equal(locatorFixturesCanAffectDealScore(), false);
  });
});

describe('offer selector fixtures', () => {
  it('covers every target retailer with immutable selector fixture provenance', () => {
    const validation = validateOfferSelectorFixtures(offerSelectorFixtures);

    assert.deepEqual(validation, {
      status: 'valid',
      chainIds: ['city_gross', 'coop', 'hemkop', 'ica', 'lidl', 'willys'],
      issues: []
    });
    assert.equal(offerSelectorFixtures.length, 6);
    for (const fixture of offerSelectorFixtures) {
      assert.match(fixture.sourceUrl, /^https:\/\//);
      assert.match(fixture.rawSnapshotRef, /^fixtures\/offer-selectors\//);
      assert.match(fixture.contentDigest, /^sha256:/);
      assert.equal(fixture.robotsPolicyRef, `${fixture.chainId}:offer`);
      assert.equal(Number.isNaN(Date.parse(fixture.capturedAt)), false);
    }
  });

  it('keeps candidate fields tied to selector evidence and out of emitted offer facts', () => {
    for (const fixture of offerSelectorFixtures) {
      const evidenceIds = new Set(fixture.selectorEvidence.map((evidence) => evidence.evidenceId));
      assert.equal(fixture.emitsOfferFacts, false);
      for (const field of fixture.candidateFields) {
        assert.equal(field.candidateOnly, true);
        assert.ok(evidenceIds.has(field.selectorEvidenceId));
      }
    }

    assert.equal(offerSelectorFixturesCanEmitOfferFacts(), false);
  });

  it('models ambiguous public offer artifacts as review-only fixtures', () => {
    const byChain = new Map(offerSelectorFixtures.map((fixture) => [fixture.chainId, fixture]));

    assert.equal(byChain.get('ica')?.artifactFormat, 'server_html');
    assert.ok(byChain.get('ica')?.candidateFields.some((field) => field.field === 'offer_price_text'));
    assert.equal(byChain.get('willys')?.artifactFormat, 'next_data');
    assert.deepEqual(byChain.get('willys')?.candidateFields, []);
    assert.equal(byChain.get('coop')?.artifactFormat, 'pdf_flyer');
    assert.ok(byChain.get('coop')?.reviewFlags.includes('pdf_only'));
    assert.equal(byChain.get('hemkop')?.artifactFormat, 'next_data');
    assert.equal(byChain.get('lidl')?.artifactFormat, 'nuxt_html');
    assert.ok(byChain.get('lidl')?.reviewFlags.includes('member_only_or_personalized'));
    assert.equal(byChain.get('city_gross')?.artifactFormat, 'react_shell');
    assert.ok(byChain.get('city_gross')?.reviewFlags.includes('skeleton_or_error_state'));
  });
});

describe('SCB PxWeb query fixtures', () => {
  it('defines valid CPI index baseline fixtures with SCB open-data posture', () => {
    const validation = validateScbPxWebQueryFixtures(scbPxWebQueryFixtures);

    assert.deepEqual(validation, {
      status: 'valid',
      fixtureIds: [
        'scb-kpi2020-coicop2m-food-division-index-top12',
        'scb-kpi2020-coicopm-food-category-index-top12',
        'scb-kpi2020-epg01m-fine-food-index-all'
      ],
      issues: []
    });
    for (const fixture of scbPxWebQueryFixtures) {
      assert.equal(fixture.source, 'SCB');
      assert.equal(fixture.license, 'CC0');
      assert.equal(fixture.contentLabel, 'Index');
      assert.equal(fixture.emitsStorePrices, false);
      assert.equal(fixture.emitsSkuPrices, false);
      assert.match(fixture.endpoint, /^https:\/\/api\.scb\.se\/OV0104\/v1\/doris\/sv\/ssd\/PR\/PR0101\/PR0101A\//);
    }
  });

  it('keeps the grocery category payload aligned to current SCB metadata', () => {
    const categoryFixture = scbPxWebQueryFixtures.find((fixture) => fixture.tableId === 'KPI2020COICOPM');

    assert.ok(categoryFixture);
    assert.deepEqual(categoryFixture.expectedDimensions, [18, 1, 12]);
    assert.equal(categoryFixture.expectedCellCount, 216);
    const categoryCodes = new Set<string>(scbCoicopFoodCategoryCodes);
    assert.equal(categoryCodes.has('01.2.4'), false);
    assert.equal(categoryCodes.has('01.2.5'), true);
  });

  it('marks EPG01 as fine-grained and 2026-only', () => {
    const epgFixture = scbPxWebQueryFixtures.find((fixture) => fixture.tableId === 'KPI2020EPG01M');

    assert.ok(epgFixture);
    assert.deepEqual(epgFixture.expectedDimensions, [97, 1, 4]);
    assert.equal(epgFixture.observedMetadata.timeRange, '2026M01..2026M04');
    assert.equal(epgFixture.payload.query[0].selection.filter, 'all');
  });

  it('computes stable cache keys and guards v1 cell counts', () => {
    for (const fixture of scbPxWebQueryFixtures) {
      assert.equal(cellCountForScbPxWebQueryFixture(fixture), fixture.expectedCellCount);
      assert.ok(fixture.expectedCellCount <= 100000);
      assert.match(cacheKeyForScbPxWebQueryFixture(fixture), /^scb:pxweb:v1:sv:PR\/PR0101\/PR0101A:/);
    }

    assert.equal(
      cacheKeyForScbPxWebQueryFixture(scbPxWebQueryFixtures[0]),
      'scb:pxweb:v1:sv:PR/PR0101/PR0101A:KPI2020COICOP2M:json-stat2:VaruTjanstegrupp=item(01):ContentsCode=item(0000080C):Tid=top(12)'
    );
  });
});

describe('Grocery category COICOP mappings', () => {
  const seedHeroProductSlugs = [
    'standardmjolk-1l',
    'agg-12-pack',
    'smor-500g',
    'bryggkaffe-450g',
    'kycklingfile-1kg',
    'notfars-500g',
    'pasta-500g',
    'basmatiris-1kg',
    'formbrod-rost-700g',
    'hushallsost-1kg',
    'bananer-1kg',
    'tomater-500g',
    'potatis-2kg',
    'toalettpapper-8-pack',
    'tvattmedel-color-1l',
    'blojor-storlek-4',
    'havredryck-1l',
    'naturell-yoghurt-1kg',
    'olivolja-500ml',
    'fryst-pizza-350g'
  ] as const;

  it('validates current category and hero-product mappings', () => {
    const validation = validateGroceryCategoryCoicopMappings(groceryCategoryCoicopMappings);

    assert.equal(validation.status, 'valid');
    assert.deepEqual(validation.issues, []);
    assert.equal(validation.mappingIds.length, groceryCategoryCoicopMappings.length);
  });

  it('covers every seed hero product with a mapped or explicitly unmapped entry', () => {
    const byHeroSlug = new Map(
      groceryCategoryCoicopMappings
        .filter((mapping) => mapping.scope === 'hero_product' && mapping.heroProductSlug)
        .map((mapping) => [mapping.heroProductSlug, mapping])
    );

    for (const slug of seedHeroProductSlugs) {
      const mapping = byHeroSlug.get(slug);
      assert.ok(mapping, `${slug} mapping missing`);
      assert.ok(mapping.mappingReason.length > 20);
      if (mapping.mappingConfidence !== 'unmapped') {
        assert.ok(mapping.scbCoicopCode, `${slug} SCB code missing`);
        assert.ok(mapping.scbContentCode, `${slug} SCB content code missing`);
      }
    }
  });

  it('keeps category baselines separate from store and SKU prices', () => {
    assert.equal(groceryCategoryCoicopMappingsCanEmitStorePrices(), false);
    for (const mapping of groceryCategoryCoicopMappings) {
      assert.equal(mapping.canUseForStorePrice, false);
      if (mapping.mappingConfidence !== 'unmapped') {
        assert.ok(mapping.scbCoicopCode);
        assert.ok(scbCoicopFoodCategoryCodes.includes(mapping.scbCoicopCode));
        assert.equal(mapping.scbTableId, 'KPI2020COICOPM');
        assert.equal(mapping.scbContentCode, '0000080H');
      }
    }
  });

  it('makes broad pantry and frozen categories product-level decisions', () => {
    const pantry = groceryCategoryCoicopMappings.find((mapping) => mapping.mappingId === 'category:pantry');
    const frozen = groceryCategoryCoicopMappings.find((mapping) => mapping.mappingId === 'category:frozen');

    assert.equal(pantry?.mappingConfidence, 'product_required');
    assert.equal(pantry?.canUseForCategoryIndexBaseline, false);
    assert.equal(frozen?.mappingConfidence, 'product_required');
    assert.equal(frozen?.canUseForCategoryIndexBaseline, false);
  });

  it('keeps household non-food products outside food CPI and Livsmedelsverket outputs', () => {
    for (const slug of ['toalettpapper-8-pack', 'tvattmedel-color-1l', 'blojor-storlek-4'] as const) {
      const mapping = groceryCategoryCoicopMappings.find((candidate) => candidate.heroProductSlug === slug);

      assert.ok(mapping);
      assert.equal(mapping.mappingConfidence, 'unmapped');
      assert.equal(mapping.canUseForCategoryIndexBaseline, false);
      assert.equal(mapping.canUseForNutritionFacts, false);
      assert.equal(mapping.scbCoicopCode, undefined);
      assert.equal(mapping.livsmedelsverketFoodNumber, undefined);
    }
  });
});

describe('planRetailerConnectorRun', () => {
  it('plans ready connector runs with deterministic idempotency and provenance metadata', () => {
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

    assert.deepEqual(plan, {
      status: 'ready',
      connectorId: 'Willys API v1',
      chainId: 'willys',
      sourceType: 'official_api',
      runKey: 'willys:official-api:willys-api-v1:2026-05-19',
      sourceRunId: 'source-run:willys:official-api:willys-api-v1:2026-05-19',
      provenance: {
        sourceType: 'official_api',
        sourceUrl: 'https://api.example.test/willys/products',
        capturedAt: '2026-05-19T18:00:00.000Z',
        parserVersion: 'willys-api-v1'
      },
      requiredActions: []
    });
  });

  it('blocks connector runs before fetch when legal or robots gates are not satisfied', () => {
    const plan = planRetailerConnectorRun({
      connectorId: 'ica-page',
      requestedAt: '2026-05-19T18:00:00.000Z',
      chainId: 'ica',
      sourceType: 'retailer_online_page',
      robotsTxtStatus: 'unknown',
      legalReviewStatus: 'pending',
      hasDataAgreement: false,
      endpointUrl: 'https://example.test/ica',
      parserVersion: 'ica-page-v1'
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
