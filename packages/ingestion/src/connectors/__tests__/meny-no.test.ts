import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseRetailerProductJsonSnapshot, type RetailerConnectorParsedProduct, type RetailerConnectorSnapshot } from '../../index.js';

const MENY_NO_FIXTURE_URL = 'https://meny.no/api/search/products?q=melk';
const capturedAt = '2026-05-23T11:30:00.000Z';

type MenyNoProduct = {
  id: string;
  title: string;
  brand?: string;
  ean?: string;
  categoryPath: string[];
  packageSize: string;
  price: string;
  unitPrice?: string;
  stockStatus: string;
  offer?: { text: string; regularPrice: string; requiresMember: boolean };
  image?: string;
  url: string;
};

const recordedMenyFixture: { products: MenyNoProduct[] } = {
  products: [
    {
      id: '7041010011438',
      title: 'TINE Lettmelk 1% 1l',
      brand: 'TINE',
      ean: '7041010011438',
      categoryPath: ['Meieri', 'Melk'],
      packageSize: '1 l',
      price: '22,90',
      unitPrice: '22,90 kr/l',
      stockStatus: 'in_stock',
      image: 'https://bilder.ngdata.no/7041010011438/meny/large.jpg',
      url: '/varer/meieri/melk/tine-lettmelk-7041010011438'
    },
    {
      id: '7038010012205',
      title: 'Norvegia Original 500g',
      brand: 'TINE',
      ean: '7038010012205',
      categoryPath: ['Meieri', 'Ost'],
      packageSize: '500 g',
      price: '79,90',
      unitPrice: '159,80 kr/kg',
      stockStatus: 'sold_out',
      offer: { text: 'Trumf-medlem: 2 for 140', regularPrice: '89,90', requiresMember: true },
      image: 'https://bilder.ngdata.no/7038010012205/meny/large.jpg',
      url: '/varer/meieri/ost/norvegia-original-7038010012205'
    }
  ]
};

function norwegianDecimal(value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  if (!/\d/.test(normalized)) throw new Error('Invalid MENY price: ' + value);
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error('Invalid MENY price: ' + value);
  return parsed;
}

function parsePackageSize(value: string): { packageSize: number; packageUnit: string } {
  const match = /([0-9]+(?:[,.][0-9]+)?)\s*([a-zA-ZæøåÆØÅ]+)/.exec(value);
  if (!match) throw new Error(`Invalid MENY package size: ${value}`);
  return { packageSize: norwegianDecimal(match[1]!), packageUnit: match[2]!.toLowerCase() };
}

function slug(value: string): string {
  return value.toLowerCase().replaceAll(/[æå]/g, 'a').replaceAll('ø', 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function menyNoProductToParsedInput(product: MenyNoProduct): RetailerConnectorParsedProduct {
  const packageSize = parsePackageSize(product.packageSize);
  return {
    sourceType: 'retailer_online_page',
    parserVersion: 'meny-no-fixture-v1',
    rawSnapshotRef: 'fixtures/meny-no/search-melk.json',
    chainId: 'meny-no',
    storeId: 'meny-nettbutikk',
    retailerProductId: product.id,
    rawName: product.title,
    canonicalName: product.title,
    productId: `meny-no-${product.id}`,
    categoryId: slug(product.categoryPath.at(-1) ?? 'meny-no'),
    barcode: product.ean,
    brand: product.brand,
    ...packageSize,
    price: norwegianDecimal(product.price),
    regularPrice: product.offer?.regularPrice ? norwegianDecimal(product.offer.regularPrice) : undefined,
    promoText: product.offer?.text,
    memberOnly: product.offer?.requiresMember ?? false,
    isAvailable: product.stockStatus !== 'sold_out',
    observedAt: capturedAt,
    sourceUrl: `https://meny.no${product.url}`,
    imageUrl: product.image
  };
}

async function fetchMenyNoFixtureSnapshot(fetchImpl: typeof fetch): Promise<RetailerConnectorSnapshot> {
  const response = await fetchImpl(MENY_NO_FIXTURE_URL);
  if (!response.ok) throw new Error(`MENY NO fixture request failed with HTTP ${response.status}`);
  const body = await response.text();
  return {
    statusCode: response.status,
    body,
    contentType: response.headers.get('content-type'),
    retrievedAt: capturedAt,
    sourceUrl: MENY_NO_FIXTURE_URL,
    rawSnapshotRef: 'fixtures/meny-no/search-melk.json',
    contentHash: createHash('sha256').update(body).digest('hex')
  };
}

function parseMenyNoFixture(snapshot: RetailerConnectorSnapshot): RetailerConnectorParsedProduct[] {
  const payload = JSON.parse(snapshot.body) as { products?: MenyNoProduct[] };
  if (!Array.isArray(payload.products)) throw new Error('MENY NO fixture products must be an array.');
  const normalized = {
    ...snapshot,
    body: JSON.stringify({ items: payload.products.map(menyNoProductToParsedInput) })
  };
  return parseRetailerProductJsonSnapshot(normalized);
}

function mockJsonFetch(body: unknown, status = 200): typeof fetch {
  return async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('meny-no connector fixture contract', () => {
  it('mocks HTTP with a recorded fixture and parses MENY product row shape', async () => {
    const snapshot = await fetchMenyNoFixtureSnapshot(mockJsonFetch(recordedMenyFixture));
    const rows = parseMenyNoFixture(snapshot);

    assert.equal(rows.length, 2);
    const milk = rows[0]!;
    assert.equal(milk.chainId, 'meny-no');
    assert.equal(milk.storeId, 'meny-nettbutikk');
    assert.equal(milk.retailerProductId, '7041010011438');
    assert.equal(milk.rawName, 'TINE Lettmelk 1% 1l');
    assert.equal(milk.productId, 'meny-no-7041010011438');
    assert.equal(milk.categoryId, 'melk');
    assert.equal(milk.barcode, '7041010011438');
    assert.equal(milk.brand, 'TINE');
    assert.equal(milk.packageSize, 1);
    assert.equal(milk.packageUnit, 'l');
    assert.equal(milk.price, 22.9);
    assert.equal(milk.memberOnly, false);
    assert.equal(milk.isAvailable, true);
    assert.equal(milk.observedAt, capturedAt);
    assert.equal(milk.sourceUrl, 'https://meny.no/varer/meieri/melk/tine-lettmelk-7041010011438');
    assert.equal(milk.imageUrl, 'https://bilder.ngdata.no/7041010011438/meny/large.jpg');
  });

  it('covers edge cases for comma decimals, member offers, and sold-out availability', async () => {
    const rows = parseMenyNoFixture(await fetchMenyNoFixtureSnapshot(mockJsonFetch(recordedMenyFixture)));
    const cheese = rows[1]!;

    assert.equal(cheese.packageSize, 500);
    assert.equal(cheese.packageUnit, 'g');
    assert.equal(cheese.price, 79.9);
    assert.equal(cheese.regularPrice, 89.9);
    assert.equal(cheese.memberOnly, true);
    assert.equal(cheese.promoText, 'Trumf-medlem: 2 for 140');
    assert.equal(cheese.isAvailable, false);
    assert.equal(cheese.categoryId, 'ost');
  });

  it('surfaces fetch and fixture-shape errors clearly', async () => {
    await assert.rejects(
      fetchMenyNoFixtureSnapshot(mockJsonFetch({ error: 'blocked' }, 503)),
      /HTTP 503/
    );

    const badSnapshot = await fetchMenyNoFixtureSnapshot(mockJsonFetch({ products: [{ ...recordedMenyFixture.products[0], price: 'ikke pris' }] }));
    assert.throws(() => parseMenyNoFixture(badSnapshot), /Invalid MENY price/);

    const missingProducts = await fetchMenyNoFixtureSnapshot(mockJsonFetch({ items: [] }));
    assert.throws(() => parseMenyNoFixture(missingProducts), /products must be an array/);
  });
});
