import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseClasOhlsonSeProducts } from '../connectors/clas-ohlson-se.js';

describe('Clas Ohlson SE connector', () => {
  it('keeps only grocery-overlapping household categories', () => {
    const rows = parseClasOhlsonSeProducts(
      `<script type="application/ld+json">[{"@type":"Product","sku":"co-1","name":"Diskborste","category":"Städning","offers":{"price":"29,90 kr"}},{"@type":"Product","sku":"co-2","name":"Skruvdragare","category":"Verktyg","offers":{"price":"399 kr"}}]</script>`,
      { retrievedAt: '2026-05-24T00:00:00.000Z', sourceUrl: 'https://www.clasohlson.com/se/Stadning/c/1195' }
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.code, 'co-1');
    assert.equal(rows[0]?.country, 'SE');
    assert.equal(rows[0]?.currency, 'SEK');
    assert.equal(rows[0]?.overlappingCategory, 'cleaning');
    assert.equal(rows[0]?.price, 29.9);
  });
});
