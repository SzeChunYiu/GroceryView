import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRetailersQuery,
  mapRetailerRow
} from '../queries/retailers.js';

describe('retailer metadata queries', () => {
  it('builds a bounded query for supported grocery retailers with label metadata', () => {
    const query = buildRetailersQuery();

    assert.deepEqual(query.values[0], ['city-gross', 'coop', 'hemkop', 'ica', 'lidl', 'willys']);
    assert.match(query.sql, /from chains/);
    assert.match(query.sql, /chains\.slug = any\(\$1::text\[\]\)/);
    assert.match(query.sql, /coalesce\(chains\.website_url/);
    assert.match(query.sql, /as logo/);
    assert.match(query.sql, /order by array_position\(\$1::text\[\], chains\.slug\)/);
  });

  it('maps retailer rows into dropdown-ready ids, logos, and website URLs', () => {
    assert.deepEqual(mapRetailerRow({
      id: 'hemkop',
      name: 'Hemköp',
      logo: '/retailers/hemkop.svg',
      website_url: 'https://www.hemkop.se/'
    }), {
      id: 'hemkop',
      name: 'Hemköp',
      logo: '/retailers/hemkop.svg',
      websiteUrl: 'https://www.hemkop.se/'
    });
  });
});
