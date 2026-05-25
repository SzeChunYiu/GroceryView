import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRetailersQuery,
  mapRetailerRow,
  supportedRetailerIds,
  supportedRetailerMetadata
} from '../queries/retailers.js';

describe('retailer metadata queries', () => {
  it('builds a bounded query for supported grocery retailers with label metadata', () => {
    const query = buildRetailersQuery();

    assert.deepEqual(query.values[0], ['city-gross', 'coop', 'hemkop', 'ica', 'lidl', 'netto', 'willys']);
    assert.deepEqual([...supportedRetailerIds], ['city-gross', 'coop', 'hemkop', 'ica', 'lidl', 'netto', 'willys']);
    assert.match(query.sql, /from chains/);
    assert.match(query.sql, /chains\.slug = any\(\$1::text\[\]\)/);
    assert.match(query.sql, /chains\.retailer_type/);
    assert.match(query.sql, /coalesce\(chains\.website_url/);
    assert.match(query.sql, /when 'netto' then '\/retailers\/netto\.svg'/);
    assert.match(query.sql, /as logo/);
    assert.match(query.sql, /order by array_position\(\$1::text\[\], chains\.slug\)/);
  });

  it('exposes Netto chain-level comparison metadata alongside active retailers', () => {
    assert.deepEqual(supportedRetailerMetadata.netto, {
      id: 'netto',
      name: 'Netto',
      retailerType: 'grocery',
      logo: '/retailers/netto.svg',
      websiteUrl: 'https://www.coop.se/'
    });
  });

  it('maps retailer rows into dropdown-ready ids, logos, and website URLs', () => {
    assert.deepEqual(mapRetailerRow({
      id: 'hemkop',
      name: 'Hemköp',
      retailer_type: 'grocery',
      logo: '/retailers/hemkop.svg',
      website_url: 'https://www.hemkop.se/'
    }), {
      id: 'hemkop',
      name: 'Hemköp',
      retailerType: 'grocery',
      logo: '/retailers/hemkop.svg',
      websiteUrl: 'https://www.hemkop.se/'
    });
  });
});
