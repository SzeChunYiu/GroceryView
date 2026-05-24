import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseYaraMarketSeRows } from '../connectors/yara-market-se.js';

const locations = `
  <div data-yara-location="Yara Market A" data-yara-address="Adress 1"></div>
  <div data-yara-location="Yara Market B" data-yara-address="Adress 2"></div>
  <div data-yara-location="Yara Market C" data-yara-address="Adress 3"></div>
`;

describe('Yara Market SE connector', () => {
  it('requires at least three locations and emits whitelisted ME grocery rows', () => {
    const rows = parseYaraMarketSeRows(
      `${locations}<script type="application/ld+json">[{"@type":"Product","sku":"ym-1","name":"Bulgur fin","category":"Dry goods","offers":{"price":"39,90 kr"}},{"@type":"Product","sku":"ym-2","name":"Kökskniv","category":"Kitchen tools","offers":{"price":"99 kr"}}]</script>`,
      { retrievedAt: '2026-05-24T00:00:00.000Z', sourceUrl: 'https://yaramarket.se/' }
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.chain, 'yara-market');
    assert.equal(rows[0]?.retailer_type, 'ethnic_middle_eastern');
    assert.equal(rows[0]?.country, 'SE');
    assert.equal(rows[0]?.currency, 'SEK');
    assert.equal(rows[0]?.locations.length, 3);
    assert.equal(rows[0]?.overlap_category, 'dry_goods');
  });

  it('returns no rows when multi-location threshold is not met', () => {
    const rows = parseYaraMarketSeRows(
      `<div data-yara-location="Only one" data-yara-address="Adress 1"></div><script type="application/ld+json">{"@type":"Product","name":"Bulgur","offers":{"price":"39 kr"}}</script>`,
      { retrievedAt: '2026-05-24T00:00:00.000Z', sourceUrl: 'https://yaramarket.se/' }
    );

    assert.deepEqual(rows, []);
  });
});
