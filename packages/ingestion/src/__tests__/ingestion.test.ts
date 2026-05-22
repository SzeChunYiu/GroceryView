import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import {
  buildCoopSearchUrl,
  buildCoopStoreInfoUrl,
  buildCoopStoresUrl,
  buildDailyConnectorConfigsFromEnv,
  DEFAULT_HEMKOP_WEEKLY_DISCOUNTS_STORE_IDS,
  DEFAULT_WILLYS_WEEKLY_DISCOUNTS_STORE_IDS,
  buildHemkopSearchUrl,
  buildHemkopWeeklyDiscountsUrl,
  buildEmaginPdfUrl,
  buildIcaStorePromotionsUrl,
  buildMatpriskollenStoreOffersUrl,
  buildMatpriskollenStoresUrl,
  buildMathemSearchUrl,
  buildMatsparSearchUrl,
  buildOpenFoodFactsProductUrl,
  buildOpenPricesConnectorUrl,
  cacheKeyForScbPxWebQueryFixture,
  cellCountForScbPxWebQueryFixture,
  confidenceForSource,
  buildWillysSearchUrl,
  buildWillysStoresUrl,
  buildWillysWeeklyDiscountsUrl,
  extractOpenFoodFactsBarcodeFromAxfoodImageUrl,
  fetchOpenFoodFactsExportProducts,
  fetchOpenFoodFactsExportRetailerEnrichments,
  fetchOpenFoodFactsProducts,
  fetchOpenFoodFactsRetailerEnrichments,
  fetchOverpassGroceryStores,
  fetchRetailerConnectorSnapshot,
  fetchCoopPublicServiceAccess,
  fetchCoopProducts,
  fetchCoopStores,
  fetchCoopWeeklyDiscounts,
  fetchHemkopProducts,
  fetchHemkopWeeklyDiscounts,
  fetchIcaDefaultStoreProducts,
  fetchIcaProducts,
  fetchIcaReklambladOffers,
  fetchMathemProducts,
  fetchMatpriskollenOffers,
  fetchMatsparProducts,
  fetchWillysProducts,
  fetchWillysStores,
  fetchWillysWeeklyDiscounts,
  parseIcaReklambladOffers,
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
  runDailyIngestion,
  stockholmStoreLocatorFixtures,
  validateOfferSelectorFixtures,
  validateGroceryCategoryCoicopMappings,
  scbCoicopFoodCategoryCodes,
  scbPxWebQueryFixtures,
  validateScbPxWebQueryFixtures,
  validateStoreLocatorFixtures
} from '../index.js';
import type { QueryExecutor } from '@groceryview/db';

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
          nutriments: {
            energy_100g: 180,
            'energy-kcal_100g': 43,
            fat_100g: 1.5,
            'saturated-fat_100g': 0.2,
            carbohydrates_100g: 6.5,
            sugars_100g: 5.2,
            fiber_100g: 0.8,
            proteins_100g: 1,
            salt_100g: 0.12,
            sodium_100g: 0.048
          },
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
      nutritionPer100g: {
        energyKj: 180,
        energyKcal: 43,
        fat: 1.5,
        saturatedFat: 0.2,
        carbohydrates: 6.5,
        sugars: 5.2,
        fiber: 0.8,
        proteins: 1,
        salt: 0.12,
        sodium: 0.048
      },
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
      'code\turl\tproduct_name\tquantity\tbrands\tcategories_tags\tlabels_tags\tnutriscore_grade\tenergy_100g\tenergy-kcal_100g\tfat_100g\tsaturated-fat_100g\tcarbohydrates_100g\tsugars_100g\tfiber_100g\tproteins_100g\tsalt_100g\tsodium_100g\timage_url',
      '7340083494406\thttps://world.openfoodfacts.org/product/7340083494406/havredryck-choklad-eldorado\tHavredryck choklad\t1 l\tEldorado\ten:beverages,en:dairy-substitutes\ten:vegan\td\t180\t43\t1.5\t0.2\t6.5\t5.2\t0.8\t1\t0.12\t0.048\thttps://images.openfoodfacts.org/images/products/734/008/349/4406/front_sv.11.400.jpg'
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
    assert.equal(rows[0].nutritionPer100g.energyKcal, 43);
    assert.equal(rows[0].nutritionPer100g.sugars, 5.2);
    assert.equal(rows[0].sourceUrl, `${OPENFOODFACTS_EXPORT_URL}#code=7340083494406`);
  });
});

describe('fetchOpenFoodFactsExportRetailerEnrichments', () => {
  it('joins only retailer candidate barcodes from the export and skips nutrition-empty rows', async () => {
    const tsv = [
      'code\turl\tproduct_name\tquantity\tbrands\tcategories_tags\tlabels_tags\tnutriscore_grade\tenergy_100g\tenergy-kcal_100g\tfat_100g\tsaturated-fat_100g\tcarbohydrates_100g\tsugars_100g\tfiber_100g\tproteins_100g\tsalt_100g\tsodium_100g\timage_url',
      '7310130003547\thttps://world.openfoodfacts.org/product/7310130003547/ideal-makaroner-kungsornen\tIdeal Makaroner\t750 g\tKungsörnen\ten:pastas\t\ta\t1509\t361\t2\t0.5\t72\t3\t3\t11\t0.01\t0.004\thttps://images.openfoodfacts.org/images/products/731/013/000/3547/front_sv.11.400.jpg',
      '7310130000000\thttps://world.openfoodfacts.org/product/7310130000000/missing-nutrition\tMissing Nutrition\t1 kg\tTestbrand\ten:pastas\t\tunknown\t\t\t\t\t\t\t\t\t\t\t',
      '7340083494406\thttps://world.openfoodfacts.org/product/7340083494406/havredryck-choklad-eldorado\tHavredryck choklad\t1 l\tEldorado\ten:beverages\ten:vegan\td\t180\t43\t1.5\t0.2\t6.5\t5.2\t0.8\t1\t0.12\t0.048\thttps://images.openfoodfacts.org/images/products/734/008/349/4406/front_sv.11.400.jpg'
    ].join('\n');
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      return new Response(gzipSync(tsv), { status: 200, headers: { 'content-type': 'application/gzip' } });
    };

    const rows = await fetchOpenFoodFactsExportRetailerEnrichments({
      fetchImpl,
      retrievedAt: '2026-05-22T09:54:39.728Z',
      candidates: [
        {
          chain: 'willys',
          productCode: '101205621_ST',
          name: 'Idealmakaroner Gammaldags',
          brand: 'Kungsörnen',
          packageText: 'KUNGSÖRNEN, 750g',
          imageUrl: 'https://assets.axfood.se/image/upload/f_auto,t_200/07310130003547_C1R1_s03',
          sourceUrl: 'https://www.willys.se/search?q=makaroner',
          retrievedAt: '2026-05-20T23:54:12.788Z'
        },
        {
          chain: 'coop',
          productCode: '7310130000000',
          name: 'Missing Nutrition',
          brand: 'Testbrand',
          packageText: '1 kg',
          barcode: '7310130000000',
          sourceUrl: 'https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1',
          retrievedAt: '2026-05-21T01:29:42.710Z'
        },
        {
          chain: 'coop',
          productCode: 'not-in-export',
          name: 'No Match',
          brand: '',
          packageText: '',
          barcode: '00000000',
          sourceUrl: 'https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1',
          retrievedAt: '2026-05-21T01:29:42.710Z'
        }
      ]
    });

    assert.deepEqual(requestedUrls, [OPENFOODFACTS_EXPORT_URL]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].barcode, '7310130003547');
    assert.equal(rows[0].sourceUrl, `${OPENFOODFACTS_EXPORT_URL}#code=7310130003547`);
    assert.equal(rows[0].nutritionPer100g.energyKcal, 361);
    assert.deepEqual(rows[0].retailerMatches.map((match) => match.productCode), ['101205621_ST']);
  });
});

describe('fetchOpenFoodFactsRetailerEnrichments', () => {
  it('adds barcode nutrition only for matched OpenFoodFacts retailer candidates', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      const code = String(url).includes('7310130003547') ? '7310130003547' : '';
      const status = code ? 200 : 404;
      return new Response(JSON.stringify(code ? {
        status: 1,
        product: {
          code,
          product_name_sv: 'Ideal Makaroner',
          brands: 'Kungsörnen',
          quantity: '750 g',
          categories_tags: ['en:pastas'],
          labels_tags: [],
          nutriscore_grade: 'a',
          nutriments: {
            energy_100g: 1509,
            'energy-kcal_100g': 361,
            fat_100g: 2,
            'saturated-fat_100g': 0.5,
            carbohydrates_100g: 72,
            sugars_100g: 3,
            fiber_100g: 3,
            proteins_100g: 11,
            salt_100g: 0.01,
            sodium_100g: 0.004
          },
          url: 'https://world.openfoodfacts.org/product/7310130003547/ideal-makaroner-kungsornen'
        }
      } : { status: 0 }), { status, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchOpenFoodFactsRetailerEnrichments({
      fetchImpl,
      retrievedAt: '2026-05-22T08:25:07.875Z',
      candidates: [
        {
          chain: 'willys',
          productCode: '101205621_ST',
          name: 'Idealmakaroner Gammaldags',
          brand: 'Kungsörnen',
          packageText: 'KUNGSÖRNEN, 750g',
          imageUrl: 'https://assets.axfood.se/image/upload/f_auto,t_200/07310130003547_C1R1_s03',
          sourceUrl: 'https://www.willys.se/search?q=makaroner',
          retrievedAt: '2026-05-20T23:54:12.788Z'
        },
        {
          chain: 'hemkop',
          productCode: '101205621_ST',
          name: 'Idealmakaroner Gammaldags',
          brand: 'Kungsörnen',
          packageText: 'KUNGSÖRNEN, 750g',
          imageUrl: 'https://assets.axfood.se/image/upload/f_auto,t_200/07310130003547_C1R1_s03',
          sourceUrl: 'https://www.hemkop.se/search?q=makaroner',
          retrievedAt: '2026-05-21T00:41:39.516Z'
        },
        {
          chain: 'coop',
          productCode: 'missing',
          name: 'Missing',
          brand: '',
          packageText: '',
          barcode: '00000000',
          sourceUrl: 'https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1',
          retrievedAt: '2026-05-21T01:29:42.710Z'
        }
      ]
    });

    assert.deepEqual(requestedUrls, [
      buildOpenFoodFactsProductUrl('7310130003547'),
      buildOpenFoodFactsProductUrl('00000000')
    ]);
    assert.equal(extractOpenFoodFactsBarcodeFromAxfoodImageUrl('https://assets.axfood.se/image/upload/f_auto,t_200/07310130003547_C1R1_s03'), '7310130003547');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].barcode, '7310130003547');
    assert.equal(rows[0].nutritionPer100g.energyKcal, 361);
    assert.deepEqual(rows[0].retailerMatches.map((match) => match.chain), ['willys', 'hemkop']);
  });
});

describe('fetchCoopProducts', () => {
  it('fetches Coop branch catalog metadata from the public store API', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      if (String(url) === buildCoopStoresUrl()) {
        return new Response(JSON.stringify({
          stores: [
            { ledgerAccountNumber: '251300', name: 'Stora Coop Boländerna', siteId: 1658, conceptName: 'Stora Coop' },
            { ledgerAccountNumber: '252700', name: 'Stora Coop Bromma', siteId: 1443, conceptName: 'Stora Coop' }
          ]
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      const storeId = String(url).includes('/252700') ? '252700' : '251300';
      return new Response(JSON.stringify({
        ledgerAccountNumber: storeId,
        siteId: storeId === '252700' ? 1443 : 1658,
        name: storeId === '252700' ? 'Stora Coop Bromma' : 'Stora Coop Boländerna',
        concept: { name: 'Stora Coop' },
        address: storeId === '252700' ? 'Ulvsundavägen 185' : 'Rapsgatan 1b',
        city: storeId === '252700' ? 'Bromma' : 'Uppsala',
        postalCode: storeId === '252700' ? '16867' : '75323',
        latitude: storeId === '252700' ? 59.354 : 59.8456428,
        longitude: storeId === '252700' ? 17.955 : 17.6954236,
        weeklyOffersLink: `https://dr.coop.se/butik/${storeId}`,
        url: `/butiker-erbjudanden/coop/${storeId}/`
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchCoopStores({
      fetchImpl,
      storeApiSubscriptionKey: 'public-store-test-key',
      maxRows: 2,
      retrievedAt: '2026-05-22T11:00:00.000Z'
    });

    assert.deepEqual(requestedUrls, [
      buildCoopStoresUrl(),
      buildCoopStoreInfoUrl('251300'),
      buildCoopStoreInfoUrl('252700')
    ]);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      storeId: '251300',
      siteId: '1658',
      ledgerAccountNumber: '251300',
      name: 'Stora Coop Boländerna',
      conceptName: 'Stora Coop',
      address: 'Rapsgatan 1b',
      city: 'Uppsala',
      postalCode: '75323',
      latitude: 59.8456428,
      longitude: 17.6954236,
      weeklyOffersLink: 'https://dr.coop.se/butik/251300',
      url: '/butiker-erbjudanden/coop/251300/',
      sourceUrl: buildCoopStoresUrl(),
      retrievedAt: '2026-05-22T11:00:00.000Z'
    });
  });

  it('fetches public Coop personalization rows with price provenance', async () => {
    const requestedUrls: string[] = [];
    let requestBody = '';
    const fetchImpl: typeof fetch = async (url, init) => {
      requestedUrls.push(String(url));
      assert.equal(init?.method, 'POST');
      requestBody = String(init?.body);
      return new Response(JSON.stringify({
        results: {
          items: [{
            id: '7310760012896',
            ean: '7310760012896',
            name: 'Bryggkaffe Mellanrost',
            manufacturerName: 'Arvid Nordquist',
            packageSizeInformation: '500 g',
            imageUrl: 'http://res.cloudinary.com/coopsverige/image/upload/v1676905402/cloud/274664.tiff',
            availableOnline: true,
            salesPriceData: { b2cPrice: 75.17 },
            comparativePriceData: { b2cPrice: 150.34 },
            comparativePriceText: 'kr/kg',
            navCategories: [{
              name: 'Bryggkaffe',
              superCategories: [{
                name: 'Kaffe',
                superCategories: [{ name: 'Dryck', superCategories: [] }]
              }]
            }],
            onlinePromotions: [{
              message: 'Arvid Nordquist 2 för 130-2 för 130:-',
              priceData: { b2cPrice: 130 },
              medMeraRequired: false
            }]
          }]
        }
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchCoopProducts({
      fetchImpl,
      subscriptionKey: 'public-test-key',
      retrievedAt: '2026-05-21T01:30:00.000Z'
    });

    assert.equal(requestedUrls[0], buildCoopSearchUrl());
    assert.equal(JSON.parse(requestBody).query, 'kaffe');
    assert.deepEqual(rows, [{
      code: '7310760012896',
      ean: '7310760012896',
      name: 'Bryggkaffe Mellanrost',
      brand: 'Arvid Nordquist',
      packageText: '500 g',
      category: 'Bryggkaffe',
      price: 75.17,
      priceText: '75.17 SEK',
      unitPrice: 150.34,
      unitPriceText: '150.34 kr/kg',
      unitPriceUnit: 'kr/kg',
      promotionText: 'Arvid Nordquist 2 för 130-2 för 130:-',
      promotionPrice: 130,
      medMeraRequired: false,
      availableOnline: true,
      sourceUrl: buildCoopSearchUrl(),
      productUrl: 'https://www.coop.se/handla/varor/dryck/kaffe/bryggkaffe/bryggkaffe-mellanrost-7310760012896/',
      imageUrl: 'http://res.cloudinary.com/coopsverige/image/upload/v1676905402/cloud/274664.tiff',
      retrievedAt: '2026-05-21T01:30:00.000Z'
    }]);
  });

  it('reads Coop personalization API settings from the public handla page', async () => {
    const fetchImpl: typeof fetch = async () => new Response(`
      <script>
        window.coopSettings = {
          "serviceAccess": {
            "personalizationApiUrl": "https://external.api.coop.se/personalization",
            "personalizationApiSubscriptionKey": "public-page-key",
            "personalizationApiVersion": "v1"
          }
        };
      </script>
    `, { status: 200, headers: { 'content-type': 'text/html' } });

    assert.deepEqual(await fetchCoopPublicServiceAccess(fetchImpl), {
      personalizationApiUrl: 'https://external.api.coop.se/personalization',
      personalizationApiSubscriptionKey: 'public-page-key',
      personalizationApiVersion: 'v1'
    });
  });
});

describe('fetchCoopWeeklyDiscounts', () => {
  it('fetches Coop weekly discounts for multiple public flyer branches', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      requestedUrls.push(String(url));
      if (String(url).includes('/stores/')) {
        const storeId = String(url).includes('/252700') ? '252700' : '251300';
        const storeName = storeId === '252700' ? 'Stora Coop Bromma' : 'Stora Coop Boländerna';
        const city = storeId === '252700' ? 'Bromma' : 'Uppsala';
        const flyerUrl = storeId === '252700'
          ? 'https://dr.coop.se/Butik/Stora-Coop-Bromma'
          : 'https://dr.coop.se/Butik/Stora-Coop-Uppsala-Bol%C3%A4nderna';
        return new Response(JSON.stringify({
          ledgerAccountNumber: storeId,
          name: storeName,
          city,
          flyers: [{
            startDate: '2026-05-18T00:00:00',
            stopDate: '2026-05-24T23:59:59',
            current: true,
            pdfExists: true,
            pdfUrl: flyerUrl,
            isHemmaBilaga: false
          }]
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }

      return new Response(JSON.stringify({
        results: {
          items: [{
            id: '7310865005168',
            ean: '7310865005168',
            name: 'Smör Normalsaltat',
            manufacturerName: 'Svenskt Smör från Arla',
            packageSizeInformation: '500g',
            salesPriceData: { b2cPrice: 61.45 },
            comparativePriceText: 'kr/kg',
            onlinePromotions: [{
              id: '016001_41099',
              message: 'Medlemspris-Smör 45 kr/st-1 för 45:-',
              priceData: { b2cPrice: 45 },
              comparativePrice: { b2cPrice: 90 },
              medMeraRequired: true
            }]
          }]
        }
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchCoopWeeklyDiscounts({
      storeIds: ['251300', '252700'],
      productQueries: ['Svenskt smör Arla 500 g'],
      fetchImpl,
      subscriptionKey: 'public-test-key',
      storeApiSubscriptionKey: 'public-store-test-key',
      retrievedAt: '2026-05-22T09:05:00.000Z'
    });

    assert.deepEqual(requestedUrls, [
      buildCoopStoreInfoUrl('251300'),
      buildCoopSearchUrl('251300'),
      buildCoopStoreInfoUrl('252700'),
      buildCoopSearchUrl('252700')
    ]);
    assert.deepEqual(rows.map((row) => [row.storeId, row.storeName, row.region, row.code]), [
      ['251300', 'Stora Coop Boländerna', 'Uppsala', '7310865005168'],
      ['252700', 'Stora Coop Bromma', 'Bromma', '7310865005168']
    ]);
    assert.equal(rows[0]?.ordinaryPrice, 61.45);
    assert.equal(rows[0]?.offerPrice, 45);
    assert.equal(rows[1]?.flyerUrl, 'https://dr.coop.se/Butik/Stora-Coop-Bromma');
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

describe('fetchHemkopProducts', () => {
  it('fetches public Hemkop search rows with price provenance', async () => {
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
          priceValue: 14.14,
          price: '14,14 kr',
          comparePrice: '18,85 kr',
          comparePriceUnit: 'kg',
          image: { url: 'https://assets.axfood.se/image/upload/f_auto,t_200/07310130003547_C1R1_s03' },
          labels: ['keyhole'],
          online: true,
          outOfStock: false
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchHemkopProducts({
      queries: ['makaroner'],
      fetchImpl,
      retrievedAt: '2026-05-21T00:45:00.000Z'
    });

    assert.equal(requestedUrls[0], buildHemkopSearchUrl('makaroner'));
    assert.deepEqual(rows, [{
      code: '101205621_ST',
      name: 'Idealmakaroner Gammaldags',
      brand: 'Kungsörnen',
      packageText: 'KUNGSÖRNEN, 750g',
      category: 'skafferi|pasta',
      price: 14.14,
      priceText: '14,14 kr',
      unitPriceText: '18,85 kr',
      unitPriceUnit: 'kg',
      imageUrl: 'https://assets.axfood.se/image/upload/f_auto,t_200/07310130003547_C1R1_s03',
      labels: ['keyhole'],
      online: true,
      outOfStock: false,
      sourceUrl: buildHemkopSearchUrl('makaroner'),
      retrievedAt: '2026-05-21T00:45:00.000Z'
    }]);
  });

  it('deduplicates products across Hemkop search queries', async () => {
    const fetchImpl: typeof fetch = async () => new Response(JSON.stringify({
      results: [{
        code: 'duplicate',
        name: 'Same product',
        priceValue: 10,
        price: '10,00 kr'
      }]
    }), { status: 200 });

    const rows = await fetchHemkopProducts({
      queries: ['a', 'b'],
      fetchImpl,
      retrievedAt: '2026-05-21T00:45:00.000Z'
    });

    assert.equal(rows.length, 1);
  });
});

describe('fetchHemkopWeeklyDiscounts', () => {
  it('fetches public Hemkop Axfood weekly discount rows with promotion provenance', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      return new Response(JSON.stringify({
        results: [{
          manufacturer: 'Arla',
          name: 'Svenskt smör',
          priceNoUnit: '62.41',
          googleAnalyticsCategory: 'mejeri-ost-och-agg|smor',
          displayVolume: '500g',
          image: { url: 'https://assets.axfood.se/image/upload/f_auto,t_200/07310865005168_C1L1_s01' },
          labels: ['swedish_flag'],
          potentialPromotions: [{
            code: '2500298172',
            mainProductCode: '101017249_ST',
            name: 'Svenskt smör',
            brands: ['Arla'],
            campaignType: 'LOYALTY',
            promotionType: 'MixMatchPricePromotion',
            price: 39.95,
            cartLabel: '39,95 kr/st',
            comparePrice: '79,90/kg',
            savePrice: 'Spara 22,46 kr',
            weightVolume: '500g',
            conditionLabel: '',
            redeemLimitLabel: 'Max 3 köp',
            startDate: '18/05-2026',
            endDate: '24/05-2026',
            validUntil: 1779659999000
          }]
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchHemkopWeeklyDiscounts({
      storeId: '4003',
      maxRows: 1,
      fetchImpl,
      retrievedAt: '2026-05-22T08:25:03.000Z'
    });

    assert.equal(requestedUrls[0], buildHemkopWeeklyDiscountsUrl('4003', 1));
    assert.deepEqual(rows, [{
      code: '2500298172',
      productCode: '101017249_ST',
      name: 'Svenskt smör',
      brand: 'Arla',
      storeId: '4003',
      campaignType: 'LOYALTY',
      promotionType: 'MixMatchPricePromotion',
      price: 39.95,
      priceText: '39,95 kr/st',
      comparePriceText: '79,90/kg',
      regularPriceText: '62.41',
      savePriceText: 'Spara 22,46 kr',
      packageText: '500g',
      conditionText: '',
      redeemLimitText: 'Max 3 köp',
      startDate: '18/05-2026',
      endDate: '24/05-2026',
      validUntil: '2026-05-24T21:59:59.000Z',
      category: 'mejeri-ost-och-agg|smor',
      imageUrl: 'https://assets.axfood.se/image/upload/f_auto,t_200/07310865005168_C1L1_s01',
      labels: ['swedish_flag'],
      sourceUrl: buildHemkopWeeklyDiscountsUrl('4003', 1),
      retrievedAt: '2026-05-22T08:25:03.000Z'
    }]);
  });

  it('paginates Hemkop Axfood weekly discounts until reported pages are exhausted', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      const page = new URL(String(url)).searchParams.get('page');
      return new Response(JSON.stringify({
        pagination: { numberOfPages: 2, currentPage: Number(page) },
        results: [{
          manufacturer: 'Garant',
          name: `Hemkop offer ${page}`,
          priceNoUnit: '20',
          displayVolume: '500g',
          potentialPromotions: [{
            code: `hemkop-${page}`,
            mainProductCode: `hemkop-product-${page}`,
            name: `Hemkop offer ${page}`,
            price: 15,
            cartLabel: '15 kr/st'
          }]
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchHemkopWeeklyDiscounts({
      storeId: '4003',
      maxRows: 10,
      pageSize: 1,
      fetchImpl,
      retrievedAt: '2026-05-22T08:25:03.000Z'
    });

    assert.deepEqual(requestedUrls, [
      buildHemkopWeeklyDiscountsUrl('4003', 1, 0),
      buildHemkopWeeklyDiscountsUrl('4003', 1, 1)
    ]);
    assert.deepEqual(rows.map((row) => row.code), ['hemkop-0', 'hemkop-1']);
    assert.equal(rows[1]?.sourceUrl, buildHemkopWeeklyDiscountsUrl('4003', 1, 1));
  });

  it('keeps Hemkop weekly discount rows distinct by store when promotion codes repeat', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      const storeId = new URL(String(url)).searchParams.get('q');
      return new Response(JSON.stringify({
        pagination: { numberOfPages: 1 },
        results: [{
          manufacturer: 'Garant',
          name: `Shared Hemkop offer ${storeId}`,
          priceNoUnit: '20',
          displayVolume: '500g',
          potentialPromotions: [{
            code: 'shared-hemkop-promo',
            mainProductCode: 'shared-hemkop-product',
            name: `Shared Hemkop offer ${storeId}`,
            price: 15,
            cartLabel: '15 kr/st'
          }]
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchHemkopWeeklyDiscounts({
      storeIds: ['4003', '4127'],
      maxRows: 10,
      pageSize: 1,
      fetchImpl,
      retrievedAt: '2026-05-22T08:25:03.000Z'
    });

    assert.deepEqual(requestedUrls, [
      buildHemkopWeeklyDiscountsUrl('4003', 1, 0),
      buildHemkopWeeklyDiscountsUrl('4127', 1, 0)
    ]);
    assert.deepEqual(rows.map((row) => [row.storeId, row.code]), [
      ['4003', 'shared-hemkop-promo'],
      ['4127', 'shared-hemkop-promo']
    ]);
  });

  it('uses the configured Hemkop weekly store list by default', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      const storeId = new URL(String(url)).searchParams.get('q');
      return new Response(JSON.stringify({
        pagination: { numberOfPages: 1 },
        results: [{
          name: `Default Hemkop offer ${storeId}`,
          priceNoUnit: '20',
          potentialPromotions: [{
            code: `default-hemkop-promo-${storeId}`,
            mainProductCode: `default-hemkop-product-${storeId}`,
            name: `Default Hemkop offer ${storeId}`,
            price: 15,
            cartLabel: '15 kr/st'
          }]
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchHemkopWeeklyDiscounts({
      pageSize: 1,
      fetchImpl,
      retrievedAt: '2026-05-22T08:25:03.000Z'
    });

    assert.deepEqual(requestedUrls, DEFAULT_HEMKOP_WEEKLY_DISCOUNTS_STORE_IDS.map((storeId) =>
      buildHemkopWeeklyDiscountsUrl(storeId, 1, 0)
    ));
    assert.deepEqual(rows.map((row) => row.storeId), [...DEFAULT_HEMKOP_WEEKLY_DISCOUNTS_STORE_IDS]);
  });
});

describe('fetchIcaProducts', () => {
  it('fetches ICA store-scoped promotion products with source provenance', async () => {
    const requestedUrls: string[] = [];
    const payload = {
      productGroups: [{
        type: 'ON_OFFER',
        decoratedProducts: [{
          productId: 'ff3ce59d-323e-42ae-b433-26953b77c7e7',
          retailerProductId: '2077461',
          name: 'Babyplommontomater 500g Klass 1 ICA',
          brand: 'ICA',
          packSizeDescription: '0.5kg',
          countryOfOrigin: 'Marocko',
          price: { amount: 37.9, currency: 'SEK' },
          unitPrice: { price: { amount: 75.8, currency: 'SEK' }, unit: 'fop.price.per.kg' },
          promoPrice: { amount: 28, currency: 'SEK' },
          promoUnitPrice: { price: { amount: 56, currency: 'SEK' }, unit: 'fop.price.per.kg' },
          promotions: [{ description: '28 kr/st' }],
          image: { src: 'https://handlaprivatkund.ica.se/images-v3/example/300x300.jpg' }
        }]
      }]
    };
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      return Response.json(payload);
    };

    const rows = await fetchIcaProducts({
      fetchImpl,
      retrievedAt: '2026-05-22T08:28:14.000Z',
      maxRows: 1
    });

    assert.equal(requestedUrls[0], buildIcaStorePromotionsUrl('1004599', '6ae1c52a-99a8-4b19-9464-dd01274df39d', 1));
    assert.deepEqual(rows, [{
      code: '2077461',
      productId: 'ff3ce59d-323e-42ae-b433-26953b77c7e7',
      retailerProductId: '2077461',
      name: 'Babyplommontomater 500g Klass 1 ICA',
      brand: 'ICA',
      categories: ['ON_OFFER'],
      imageUrl: 'https://handlaprivatkund.ica.se/images-v3/example/300x300.jpg',
      productUrl: 'https://handlaprivatkund.ica.se/stores/1004599/products/2077461/details',
      packageSize: '0.5kg',
      countryOfOrigin: 'Marocko',
      price: 37.9,
      priceCurrency: 'SEK',
      unitPrice: 75.8,
      unitPriceCurrency: 'SEK',
      unitPriceUnit: 'fop.price.per.kg',
      promoPrice: 28,
      promoPriceCurrency: 'SEK',
      promoUnitPrice: 56,
      promoUnitPriceCurrency: 'SEK',
      promoUnitPriceUnit: 'fop.price.per.kg',
      promotionDescription: '28 kr/st',
      storeAccountId: '1004599',
      storeName: 'ICA Kvantum Kungsholmen',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: buildIcaStorePromotionsUrl('1004599', '6ae1c52a-99a8-4b19-9464-dd01274df39d', 1),
      retrievedAt: '2026-05-22T08:28:14.000Z'
    }]);
  });

  it('deduplicates repeated ICA store products', async () => {
    const product = {
      productId: 'product-1',
      retailerProductId: 'retailer-1',
      name: 'Same product',
      price: { amount: 10, currency: 'SEK' }
    };
    const fetchImpl: typeof fetch = async () => Response.json({
      productGroups: [
        { type: 'ON_OFFER', decoratedProducts: [product] },
        { type: 'ON_OFFER', decoratedProducts: [product] }
      ]
    });

    const rows = await fetchIcaProducts({
      fetchImpl,
      retrievedAt: '2026-05-22T08:28:14.000Z'
    });

    assert.equal(rows.length, 1);
  });

  it('fetches configured ICA store-scoped promotion batches', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      const storeAccountId = String(url).includes('/stores/1004247/') ? '1004247' : '1004599';
      return Response.json({
        productGroups: [{
          type: 'ON_OFFER',
          decoratedProducts: [{
            productId: `product-${storeAccountId}`,
            retailerProductId: `retailer-${storeAccountId}`,
            name: `Product ${storeAccountId}`,
            price: { amount: 10, currency: 'SEK' }
          }]
        }]
      });
    };

    const rows = await fetchIcaDefaultStoreProducts({
      fetchImpl,
      retrievedAt: '2026-05-22T08:49:49.000Z',
      maxRows: 1,
      stores: [
        {
          storeAccountId: '1004599',
          storeName: 'ICA Kvantum Kungsholmen',
          regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d'
        },
        {
          storeAccountId: '1004247',
          storeName: 'ICA Focus',
          regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d'
        }
      ]
    });

    assert.deepEqual(requestedUrls, [
      buildIcaStorePromotionsUrl('1004599', '6ae1c52a-99a8-4b19-9464-dd01274df39d', 1),
      buildIcaStorePromotionsUrl('1004247', '6ae1c52a-99a8-4b19-9464-dd01274df39d', 1)
    ]);
    assert.deepEqual(rows.map((row) => [row.storeAccountId, row.storeName, row.code]), [
      ['1004599', 'ICA Kvantum Kungsholmen', 'retailer-1004599'],
      ['1004247', 'ICA Focus', 'retailer-1004247']
    ]);
  });
});

describe('fetchIcaReklambladOffers', () => {
  const icaReklambladHtml = `
    <script>
      window.__INITIAL_STATE__ = {
        "headerStore": {
          "activeStore": {
            "urls": [
              {"text":"DRBlad","type":"DRBlad","url":"https:\\u002F\\u002Fwww.e-magin.se\\u002Flatestpaper\\u002F6h3pqb3k\\u002Fpaper\\u002F1"}
            ]
          }
        },
        "offers": {
          "weeklyOffers": [{
            "id": "5003918750",
            "details": {
              "brand": "Trocadero, Loka crush, Champis",
              "packageInformation": "140-150 cl",
              "name": "Läsk",
              "mechanicInfo": "3 för 40 kr"
            },
            "category": { "articleGroupName": "Skafferivaror" },
            "usesLeft": undefined,
            "validTo": "2026-05-24T00:00:00",
            "comparisonPrice": "8:89-9:52/liter + pant",
            "stores": [{
              "storeMarketingName": "ICA Focus",
              "BMSStoreId": 1735,
              "regularPrice": "14,66-22,66",
              "onlineInd": true,
              "storeInd": true,
              "referencePriceText": "Ord.pris 14:66-22:66 kr."
            }],
            "eans": [{ "id": "7310401000374", "image": "https://assets.icanet.se/7310401000374.jpg" }]
          }]
        }
      };
    </script>
  `;

  it('parses ICA weekly offer rows with e-magin flyer provenance', () => {
    const rows = parseIcaReklambladOffers(icaReklambladHtml, {
      sourceUrl: 'https://www.ica.se/erbjudanden/ica-focus-1004247/',
      retrievedAt: '2026-05-21T01:45:00.000Z'
    });

    assert.deepEqual(rows, [{
      code: '5003918750',
      name: 'Läsk',
      brand: 'Trocadero, Loka crush, Champis',
      packageText: '140-150 cl',
      category: 'Skafferivaror',
      priceText: '3 för 40 kr',
      comparisonPrice: '8:89-9:52/liter + pant',
      regularPriceText: 'Ord.pris 14:66-22:66 kr.',
      validTo: '2026-05-24T00:00:00',
      storeName: 'ICA Focus',
      storeId: '1735',
      availableInStore: true,
      availableOnline: true,
      eans: ['7310401000374'],
      sourceUrl: 'https://www.ica.se/erbjudanden/ica-focus-1004247/',
      flyerUrl: 'https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1',
      flyerPdfUrl: buildEmaginPdfUrl('https://www.e-magin.se/latestpaper/6h3pqb3k/paper/1'),
      imageUrl: 'https://assets.icanet.se/7310401000374.jpg',
      retrievedAt: '2026-05-21T01:45:00.000Z'
    }]);
  });

  it('fetches ICA reklamblad offer rows from the public store offer page', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      return new Response(icaReklambladHtml, { status: 200, headers: { 'content-type': 'text/html' } });
    };

    const rows = await fetchIcaReklambladOffers({
      fetchImpl,
      maxRows: 1,
      retrievedAt: '2026-05-21T01:45:00.000Z'
    });

    assert.equal(requestedUrls[0], 'https://www.ica.se/erbjudanden/ica-focus-1004247/');
    assert.equal(rows.length, 1);
  });
});

describe('fetchMathemProducts', () => {
  it('fetches public Mathem search page rows from embedded Next data', async () => {
    const requestedUrls: string[] = [];
    const nextData = {
      props: {
        pageProps: {
          dehydratedState: {
            queries: [{
              state: {
                data: {
                  items: [{
                    id: 6448,
                    type: 'product',
                    attributes: {
                      id: 6448,
                      fullName: 'Kungsörnen Gammaldags Idealmakaroner',
                      brand: 'Kungsörnen',
                      nameExtra: '1300 g',
                      frontUrl: 'https://www.mathem.se/se/products/6448-kungsornen-gammaldags-idealmakaroner/',
                      grossPrice: '22.24',
                      grossUnitPrice: '17.11',
                      unitPriceQuantityAbbreviation: 'kg',
                      currency: 'SEK',
                      availability: { isAvailable: true },
                      images: [{ thumbnail: { url: 'https://images.mathem.se/product.jpg' } }]
                    }
                  }]
                }
              }
            }]
          }
        }
      }
    };
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      return new Response(`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData)}</script>`, {
        status: 200,
        headers: { 'content-type': 'text/html' }
      });
    };

    const rows = await fetchMathemProducts({
      queries: ['makaroner'],
      fetchImpl,
      retrievedAt: '2026-05-21T01:00:00.000Z'
    });

    assert.equal(requestedUrls[0], buildMathemSearchUrl('makaroner'));
    assert.deepEqual(rows, [{
      code: '6448',
      name: 'Kungsörnen Gammaldags Idealmakaroner',
      brand: 'Kungsörnen',
      packageText: '1300 g',
      price: 22.24,
      priceText: '22.24 SEK',
      unitPrice: 17.11,
      unitPriceText: '17.11 SEK',
      unitPriceUnit: 'kg',
      imageUrl: 'https://images.mathem.se/product.jpg',
      productUrl: 'https://www.mathem.se/se/products/6448-kungsornen-gammaldags-idealmakaroner/',
      available: true,
      sourceUrl: buildMathemSearchUrl('makaroner'),
      retrievedAt: '2026-05-21T01:00:00.000Z'
    }]);
  });

  it('deduplicates products across Mathem search queries', async () => {
    const nextData = {
      props: {
        pageProps: {
          dehydratedState: {
            queries: [{
              state: {
                data: {
                  items: [{
                    id: 1,
                    type: 'product',
                    attributes: {
                      id: 1,
                      fullName: 'Same product',
                      grossPrice: '10.00',
                      currency: 'SEK'
                    }
                  }]
                }
              }
            }]
          }
        }
      }
    };
    const fetchImpl: typeof fetch = async () => new Response(
      `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData)}</script>`,
      { status: 200 }
    );

    const rows = await fetchMathemProducts({
      queries: ['a', 'b'],
      fetchImpl,
      retrievedAt: '2026-05-21T01:00:00.000Z'
    });

    assert.equal(rows.length, 1);
  });
});

describe('fetchMatpriskollenOffers', () => {
  it('fetches public store-scoped offer rows with price provenance', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      if (String(url).includes('/api/v1/stores?')) {
        return new Response(JSON.stringify([{
          id: 47,
          key: 'd20e31b2-2c0e-4e87-8f8e-280d41b1bb16',
          name: 'Willys Falkenberg',
          offerCount: 82
        }]), { status: 200, headers: { 'content-type': 'application/json' } });
      }

      return new Response(JSON.stringify({
        storeName: 'Willys Falkenberg',
        offers: [{
          id: 2337026,
          key: '036e04e6-99fa-4621-8321-dea0b65279f1',
          price: '29,90/frp',
          comprice: '59,80/kg',
          regular: '',
          volume: '500 g',
          condition: '',
          requiresMembershipCard: false,
          requiresCoupon: true,
          validFrom: 1779055200,
          validTo: 1779659999,
          store_id: 47,
          store_key: 'd20e31b2-2c0e-4e87-8f8e-280d41b1bb16',
          product: {
            name: 'Nektarin i ask',
            origin: 'Egypten/Italien/Spanien',
            brand: null,
            categories: [{
              name: 'Frukt',
              parent_category: { name: 'Frukt & bär' }
            }]
          },
          produkt_bild_urls: { bildUrl: 'https://mpk-product-images.example/nektarin.jpg' }
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchMatpriskollenOffers({
      fetchImpl,
      storeNamePattern: null,
      retrievedAt: '2026-05-21T01:20:00.000Z'
    });

    assert.equal(requestedUrls[0], buildMatpriskollenStoresUrl());
    assert.equal(requestedUrls[1], buildMatpriskollenStoreOffersUrl('d20e31b2-2c0e-4e87-8f8e-280d41b1bb16'));
    assert.deepEqual(rows, [{
      code: '036e04e6-99fa-4621-8321-dea0b65279f1',
      name: 'Nektarin i ask',
      brand: '',
      store: 'Willys Falkenberg',
      storeKey: 'd20e31b2-2c0e-4e87-8f8e-280d41b1bb16',
      storeId: '47',
      category: 'Frukt & bär',
      priceText: '29,90/frp',
      comparePriceText: '59,80/kg',
      regularPriceText: '',
      packageText: '500 g',
      condition: '',
      origin: 'Egypten/Italien/Spanien',
      requiresMembershipCard: false,
      requiresCoupon: true,
      validFrom: '2026-05-17T22:00:00.000Z',
      validTo: '2026-05-24T21:59:59.000Z',
      sourceUrl: buildMatpriskollenStoreOffersUrl('d20e31b2-2c0e-4e87-8f8e-280d41b1bb16'),
      productUrl: 'https://matpriskollen.se/deal/036e04e6-99fa-4621-8321-dea0b65279f1',
      imageUrl: 'https://mpk-product-images.example/nektarin.jpg',
      retrievedAt: '2026-05-21T01:20:00.000Z'
    }]);
  });

  it('deduplicates offers across Matpriskollen stores', async () => {
    const offer = {
      key: 'same-offer-key',
      price: '10,00/st',
      product: { name: 'Same offer' }
    };
    const fetchImpl: typeof fetch = async (url) => {
      if (String(url).includes('/api/v1/stores?')) {
        return new Response(JSON.stringify([
          { id: 1, key: 'store-a', name: 'Store A', offerCount: 1 },
          { id: 2, key: 'store-b', name: 'Store B', offerCount: 1 }
        ]), { status: 200 });
      }
      return new Response(JSON.stringify({ storeName: 'Store', offers: [offer] }), { status: 200 });
    };

    const rows = await fetchMatpriskollenOffers({
      fetchImpl,
      storeNamePattern: null,
      retrievedAt: '2026-05-21T01:20:00.000Z'
    });

    assert.equal(rows.length, 1);
  });
});

describe('fetchMatsparProducts', () => {
  it('fetches public Matspar page data rows with price provenance', async () => {
    const requestedUrls: string[] = [];
    const pageData = {
      payload: {
        products: [{
          productid: 3270,
          name: 'Snabbmakaroner',
          brand: 'Kungsörnen',
          image: '6204b6c746fe26cfce7c4246c2f3a29f',
          weight_pretty: '750g',
          country_from: 'Sverige',
          slug: 'produkt/snabbmakaroner-750-g-kungsornen',
          price: 1500,
          median_price: 1750,
          w_prices: { 1886: 1665, 1887: 1877 }
        }]
      }
    };
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      const escaped = JSON.stringify(JSON.stringify(pageData));
      return new Response(`<script>window.__PAGEDATA__ = JSON.parse(${escaped});</script>`, {
        status: 200,
        headers: { 'content-type': 'text/html' }
      });
    };

    const rows = await fetchMatsparProducts({
      queries: ['makaroner'],
      fetchImpl,
      retrievedAt: '2026-05-21T01:10:00.000Z'
    });

    assert.equal(requestedUrls[0], buildMatsparSearchUrl('makaroner'));
    assert.deepEqual(rows, [{
      code: '3270',
      name: 'Snabbmakaroner',
      brand: 'Kungsörnen',
      packageText: '750g',
      countryFrom: 'Sverige',
      price: 15,
      priceText: '15.00 SEK',
      medianPrice: 17.5,
      warehousePriceCount: 2,
      sourceUrl: buildMatsparSearchUrl('makaroner'),
      productUrl: 'https://www.matspar.se/produkt/snabbmakaroner-750-g-kungsornen',
      imageHash: '6204b6c746fe26cfce7c4246c2f3a29f',
      retrievedAt: '2026-05-21T01:10:00.000Z'
    }]);
  });

  it('deduplicates products across Matspar search pages', async () => {
    const pageData = {
      payload: {
        products: [{
          productid: 1,
          name: 'Same product',
          price: 1000
        }]
      }
    };
    const fetchImpl: typeof fetch = async () => new Response(
      `<script>window.__PAGEDATA__ = JSON.parse(${JSON.stringify(JSON.stringify(pageData))});</script>`,
      { status: 200 }
    );

    const rows = await fetchMatsparProducts({
      queries: ['a', 'b'],
      fetchImpl,
      retrievedAt: '2026-05-21T01:10:00.000Z'
    });

    assert.equal(rows.length, 1);
  });
});

describe('fetchWillysProducts', () => {
  it('fetches Willys branch catalog metadata from the public store API', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      return new Response(JSON.stringify([
        {
          storeId: '2149',
          name: 'Willys Alingsås Hagaplan',
          address: {
            line1: 'Hagaplan',
            town: 'Alingsås',
            postalCode: '441 34',
            country: { isocode: 'SE' },
            latitude: 57.9374,
            longitude: 12.5333
          },
          geoPoint: { latitude: 57.9374, longitude: 12.5333 },
          onlineStore: true,
          clickAndCollect: true,
          flyerURL: 'https://viewer.ipaper.io/willys/2149'
        },
        {
          storeId: '2268',
          name: 'Willys Avesta',
          address: {
            line1: 'Dalahästen, Get Johannas Väg',
            town: 'Avesta',
            postalCode: '774 61',
            country: { isocode: 'SE' }
          },
          geoPoint: { latitude: 60.1528, longitude: 16.1969 },
          onlineStore: true,
          clickAndCollect: true,
          flyerURL: 'https://viewer.ipaper.io/willys/2268'
        }
      ]), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchWillysStores({
      online: true,
      fetchImpl,
      maxRows: 2,
      retrievedAt: '2026-05-22T10:45:00.000Z'
    });

    assert.deepEqual(requestedUrls, [buildWillysStoresUrl({ online: true })]);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      storeId: '2149',
      name: 'Willys Alingsås Hagaplan',
      address: 'Hagaplan',
      city: 'Alingsås',
      postalCode: '441 34',
      countryCode: 'SE',
      latitude: 57.9374,
      longitude: 12.5333,
      onlineStore: true,
      clickAndCollect: true,
      flyerUrl: 'https://viewer.ipaper.io/willys/2149',
      sourceUrl: buildWillysStoresUrl({ online: true }),
      retrievedAt: '2026-05-22T10:45:00.000Z'
    });
  });

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

describe('fetchWillysWeeklyDiscounts', () => {
  it('fetches public Willys Axfood weekly discount rows with promotion provenance', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      return new Response(JSON.stringify({
        results: [{
          manufacturer: null,
          name: 'Grön sparris 250g',
          priceNoUnit: '34.9',
          googleAnalyticsCategory: 'frukt-och-gront|gronsaker',
          displayVolume: 'Styck',
          image: { url: 'https://assets.axfood.se/image/upload/f_auto,t_200/07311042002680_C1N0_s01' },
          labels: ['keyhole'],
          potentialPromotions: [{
            code: '2500306014',
            mainProductCode: '100771309_ST',
            name: 'Grön sparris 250g',
            brands: null,
            campaignType: 'LOYALTY',
            promotionType: 'MixMatchPricePromotion',
            price: 29.9,
            cartLabel: '29,90/st ',
            comparePrice: '119:60 kr/kg',
            savePrice: 'Spara 5,00 kr',
            weightVolume: 'Styck',
            conditionLabel: null,
            redeemLimitLabel: 'Max 5 köp',
            startDate: '20/05-2026',
            endDate: '24/05-2026',
            validUntil: 1779659999000
          }]
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchWillysWeeklyDiscounts({
      storeId: '2110',
      maxRows: 1,
      fetchImpl,
      retrievedAt: '2026-05-22T08:25:03.000Z'
    });

    assert.equal(requestedUrls[0], buildWillysWeeklyDiscountsUrl('2110', 1));
    assert.deepEqual(rows, [{
      code: '2500306014',
      productCode: '100771309_ST',
      name: 'Grön sparris 250g',
      brand: '',
      storeId: '2110',
      campaignType: 'LOYALTY',
      promotionType: 'MixMatchPricePromotion',
      price: 29.9,
      priceText: '29,90/st',
      comparePriceText: '119:60 kr/kg',
      regularPriceText: '34.9',
      savePriceText: 'Spara 5,00 kr',
      packageText: 'Styck',
      conditionText: '',
      redeemLimitText: 'Max 5 köp',
      startDate: '20/05-2026',
      endDate: '24/05-2026',
      validUntil: '2026-05-24T21:59:59.000Z',
      category: 'frukt-och-gront|gronsaker',
      imageUrl: 'https://assets.axfood.se/image/upload/f_auto,t_200/07311042002680_C1N0_s01',
      labels: ['keyhole'],
      sourceUrl: buildWillysWeeklyDiscountsUrl('2110', 1),
      retrievedAt: '2026-05-22T08:25:03.000Z'
    }]);
  });

  it('paginates Willys Axfood weekly discounts until reported pages are exhausted', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      const page = new URL(String(url)).searchParams.get('page');
      return new Response(JSON.stringify({
        pagination: { numberOfPages: 2, currentPage: Number(page) },
        results: [{
          manufacturer: 'Garant',
          name: `Willys offer ${page}`,
          priceNoUnit: '20',
          displayVolume: '500g',
          potentialPromotions: [{
            code: `willys-${page}`,
            mainProductCode: `willys-product-${page}`,
            name: `Willys offer ${page}`,
            price: 15,
            cartLabel: '15 kr/st'
          }]
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchWillysWeeklyDiscounts({
      storeId: '2110',
      maxRows: 10,
      pageSize: 1,
      fetchImpl,
      retrievedAt: '2026-05-22T08:25:03.000Z'
    });

    assert.deepEqual(requestedUrls, [
      buildWillysWeeklyDiscountsUrl('2110', 1, 0),
      buildWillysWeeklyDiscountsUrl('2110', 1, 1)
    ]);
    assert.deepEqual(rows.map((row) => row.code), ['willys-0', 'willys-1']);
    assert.equal(rows[1]?.sourceUrl, buildWillysWeeklyDiscountsUrl('2110', 1, 1));
  });

  it('keeps Willys weekly discount rows distinct by store when promotion codes repeat', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      const storeId = new URL(String(url)).searchParams.get('q');
      return new Response(JSON.stringify({
        pagination: { numberOfPages: 1 },
        results: [{
          manufacturer: 'Garant',
          name: `Shared Willys offer ${storeId}`,
          priceNoUnit: '20',
          displayVolume: '500g',
          potentialPromotions: [{
            code: 'shared-willys-promo',
            mainProductCode: 'shared-willys-product',
            name: `Shared Willys offer ${storeId}`,
            price: 15,
            cartLabel: '15 kr/st'
          }]
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchWillysWeeklyDiscounts({
      storeIds: ['2110', '2187'],
      maxRows: 10,
      pageSize: 1,
      fetchImpl,
      retrievedAt: '2026-05-22T08:25:03.000Z'
    });

    assert.deepEqual(requestedUrls, [
      buildWillysWeeklyDiscountsUrl('2110', 1, 0),
      buildWillysWeeklyDiscountsUrl('2187', 1, 0)
    ]);
    assert.deepEqual(rows.map((row) => [row.storeId, row.code]), [
      ['2110', 'shared-willys-promo'],
      ['2187', 'shared-willys-promo']
    ]);
  });

  it('uses the configured Willys weekly store list by default', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (url) => {
      requestedUrls.push(String(url));
      const storeId = new URL(String(url)).searchParams.get('q');
      return new Response(JSON.stringify({
        pagination: { numberOfPages: 1 },
        results: [{
          name: `Default Willys offer ${storeId}`,
          priceNoUnit: '20',
          potentialPromotions: [{
            code: `default-willys-promo-${storeId}`,
            mainProductCode: `default-willys-product-${storeId}`,
            name: `Default Willys offer ${storeId}`,
            price: 15,
            cartLabel: '15 kr/st'
          }]
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const rows = await fetchWillysWeeklyDiscounts({
      pageSize: 1,
      fetchImpl,
      retrievedAt: '2026-05-22T08:25:03.000Z'
    });

    assert.deepEqual(requestedUrls, DEFAULT_WILLYS_WEEKLY_DISCOUNTS_STORE_IDS.map((storeId) =>
      buildWillysWeeklyDiscountsUrl(storeId, 1, 0)
    ));
    assert.deepEqual(rows.map((row) => row.storeId), [...DEFAULT_WILLYS_WEEKLY_DISCOUNTS_STORE_IDS]);
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

class DailyIngestionExecutor implements QueryExecutor {
  calls: Array<{ sql: string; params: unknown[] }> = [];
  private sequence = 0;

  async query<T>(sql: string, params: unknown[] = []) {
    this.calls.push({ sql, params });
    if (sql.includes('insert into source_runs')) return [{ id: 'source-run-db-1' }] as T[];
    if (sql.includes('update source_runs')) return [{ id: params[0] }] as T[];
    if (sql.includes('insert into chains')) return [{ id: `chain-db-${++this.sequence}` }] as T[];
    if (sql.includes('insert into stores')) return [{ id: `store-db-${++this.sequence}` }] as T[];
    if (sql.includes('insert into products')) return [{ id: `product-db-${++this.sequence}` }] as T[];
    if (sql.includes('insert into aliases')) {
      return [{
        id: `alias-db-${++this.sequence}`,
        product_id: params[0],
        alias: params[1],
        normalized_alias: params[2],
        source_type: params[3],
        source_ref: params[4],
        match_confidence: params[5],
        reviewed_at: params[6],
        created_at: '2026-05-21T00:00:00.000Z'
      }] as T[];
    }
    if (sql.includes('insert into raw_records')) return [{ id: `raw-db-${++this.sequence}` }] as T[];
    if (sql.includes('insert into observations')) return [{ id: `observation-db-${++this.sequence}` }] as T[];
    if (sql.includes('insert into latest_prices')) return [] as T[];
    throw new Error(`Unexpected SQL in daily ingestion test: ${sql}`);
  }
}

function dailyConnectorFixture(chainId: string) {
  return {
    connectorId: `${chainId}-normalized-json`,
    chainId,
    sourceType: 'official_api' as const,
    endpointUrl: `https://sources.example.test/${chainId}/products.json`,
    parserVersion: 'normalized-json-v1',
    robotsTxtStatus: 'not_applicable' as const,
    legalReviewStatus: 'approved' as const,
    hasDataAgreement: true
  };
}

describe('daily ingestion runner', () => {
  it('loads connector config from environment without exposing secrets', () => {
    const configs = buildDailyConnectorConfigsFromEnv({
      DATABASE_URL: 'postgres://user:secret@example/groceryview',
      GROCERYVIEW_DAILY_CONNECTORS_JSON: JSON.stringify([
        dailyConnectorFixture('ica'),
        dailyConnectorFixture('willys'),
        dailyConnectorFixture('coop'),
        dailyConnectorFixture('hemkop'),
        dailyConnectorFixture('lidl'),
        dailyConnectorFixture('city_gross')
      ])
    });

    assert.equal(configs.databaseUrl, 'postgres://user:secret@example/groceryview');
    assert.equal(configs.connectors.length, 6);
    assert.equal(configs.connectors[0].chainId, 'ica');
  });

  it('fails closed when daily connector config omits any required chain', () => {
    assert.throws(() => buildDailyConnectorConfigsFromEnv({
      DATABASE_URL: 'postgres://user:secret@example/groceryview',
      GROCERYVIEW_DAILY_CONNECTORS_JSON: JSON.stringify([
        dailyConnectorFixture('ica'),
        dailyConnectorFixture('willys')
      ])
    }), /missing required daily chain connectors: coop, hemkop, lidl, city_gross/);
  });

  it('persists successful daily connector runs as source runs, raw records, and observations', async () => {
    const executor = new DailyIngestionExecutor();
    const result = await runDailyIngestion({
      executor,
      requestedAt: '2026-05-21T03:17:00.000Z',
      connectors: [
        {
          connectorId: 'willys-normalized-json',
          chainId: 'willys',
          sourceType: 'official_api',
          endpointUrl: 'https://sources.example.test/willys/products.json',
          parserVersion: 'normalized-json-v1',
          robotsTxtStatus: 'not_applicable',
          legalReviewStatus: 'approved',
          hasDataAgreement: true,
          stores: [{ storeId: 'willys-odenplan', name: 'Willys Odenplan', address: 'Odenplan', city: 'Stockholm' }]
        }
      ],
      fetchImpl: async () => new Response(JSON.stringify({
        items: [{
          storeId: 'willys-odenplan',
          retailerProductId: 'wil-zoegas-450',
          rawName: 'Zoégas Skånerost 450g',
          canonicalName: 'Zoégas Coffee 450g',
          productId: 'zoegas-coffee-450g',
          categoryId: 'coffee',
          brand: 'Zoégas',
          packageSize: 450,
          packageUnit: 'g',
          price: 49.9,
          regularPrice: 69.9,
          promoText: 'Veckans erbjudande'
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    });

    assert.equal(result.status, 'succeeded');
    assert.equal(result.persistedRuns, 1);
    assert.equal(result.acceptedCount, 1);
    assert.equal(result.observationIds.length, 1);
    const sourceRunInsert = executor.calls.find((call) => call.sql.includes('insert into source_runs'));
    assert.equal(sourceRunInsert?.params[0], 'official_api');
    assert.equal(sourceRunInsert?.params[1], 'willys-normalized-json');
    assert.deepEqual(JSON.parse(String(sourceRunInsert?.params[6])), {
      chainId: 'willys',
      cadence: 'daily',
      connectorId: 'willys-normalized-json',
      runKey: 'willys:official-api:willys-normalized-json:2026-05-21',
      parserVersion: 'normalized-json-v1',
      acceptedCount: 1,
      rejectedCount: 0
    });
    assert.equal(executor.calls.some((call) => call.sql.includes('insert into raw_records')), true);
    assert.equal(executor.calls.some((call) => call.sql.includes('insert into observations')), true);
    const storeInsert = executor.calls.find((call) => call.sql.includes('insert into stores'));
    assert.equal(storeInsert?.params[0], 'willys-odenplan');
    const latestPriceInsert = executor.calls.find((call) => call.sql.includes('insert into latest_prices'));
    assert.equal(latestPriceInsert?.params[2], 'store-db-2');
  });

  it('fails closed before persistence when store-scoped prices omit configured branch metadata', async () => {
    const executor = new DailyIngestionExecutor();
    const result = await runDailyIngestion({
      executor,
      requestedAt: '2026-05-21T03:17:00.000Z',
      connectors: [{
        connectorId: 'willys-normalized-json',
        chainId: 'willys',
        sourceType: 'official_api',
        endpointUrl: 'https://sources.example.test/willys/products.json',
        parserVersion: 'normalized-json-v1',
        robotsTxtStatus: 'not_applicable',
        legalReviewStatus: 'approved',
        hasDataAgreement: true,
        stores: [{ storeId: 'willys-odenplan', name: 'Willys Odenplan', address: 'Odenplan', city: 'Stockholm' }]
      }],
      fetchImpl: async () => new Response(JSON.stringify({
        items: [{
          storeId: 'willys-unknown-branch',
          retailerProductId: 'wil-zoegas-450',
          rawName: 'Zoégas Skånerost 450g',
          canonicalName: 'Zoégas Coffee 450g',
          productId: 'zoegas-coffee-450g',
          categoryId: 'coffee',
          brand: 'Zoégas',
          packageSize: 450,
          packageUnit: 'g',
          price: 49.9
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    });

    assert.equal(result.status, 'blocked');
    assert.deepEqual(result.blockers, ['willys:unknown_store_ids:willys-unknown-branch']);
    assert.equal(executor.calls.length, 0);
  });

  it('fails closed before persistence when a required daily connector is blocked', async () => {
    const executor = new DailyIngestionExecutor();
    const result = await runDailyIngestion({
      executor,
      requestedAt: '2026-05-21T03:17:00.000Z',
      connectors: [
        {
          connectorId: 'ica-page',
          chainId: 'ica',
          sourceType: 'retailer_online_page',
          endpointUrl: 'https://sources.example.test/ica/products.json',
          parserVersion: 'normalized-json-v1',
          robotsTxtStatus: 'unknown',
          legalReviewStatus: 'pending',
          hasDataAgreement: false
        }
      ],
      fetchImpl: async () => { throw new Error('fetch should not run for blocked connector'); }
    });

    assert.equal(result.status, 'blocked');
    assert.deepEqual(result.blockers, ['ica:robots_txt_allow_required', 'ica:legal_review_approval_required']);
    assert.equal(executor.calls.length, 0);
  });
});
