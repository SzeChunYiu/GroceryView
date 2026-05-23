import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const scriptPath = new URL('../../scripts/ops/print-daily-connector-stores.mjs', import.meta.url);
const script = readFileSync(scriptPath, 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

const willysStore = {
  storeId: '2149',
  name: 'Willys Alingsås Hagaplan',
  address: 'Hagaplan',
  city: 'Alingsås',
  countryCode: 'SE'
};
const hemkopStore = {
  storeId: '4798',
  name: 'Hemköp Bollnäs',
  address: 'Långgatan 10',
  city: 'Bollnäs',
  countryCode: 'SE'
};
const coopStore = {
  storeId: '176110',
  name: 'Coop City Hallsberg',
  address: 'Trädgårdsgatan 6',
  city: 'Hallsberg',
  supportsOnlineProductPrices: true
};
const cityGrossStore = {
  storeId: '21',
  name: 'City Gross Borås',
  address: '',
  city: 'Borås'
};
const lidlStore = {
  storeId: 'alingsas/vaenersborgsvaegen-21',
  name: 'Lidl Alingsås Vänersborgsvägen 21',
  address: 'Vänersborgsvägen 21',
  city: 'Alingsås',
  countryCode: 'SE'
};

function baseFetchers(overrides = {}) {
  return {
    DEFAULT_ICA_STORE_CONFIGS: [{
      storeAccountId: '1004599',
      storeName: 'ICA Kvantum Kungsholmen',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      city: 'Stockholm'
    }],
    fetchWillysStores: async () => [willysStore],
    fetchHemkopStores: async () => [hemkopStore],
    fetchCoopStores: async () => [coopStore],
    fetchCityGrossStores: async () => [cityGrossStore],
    fetchLidlStores: async () => [lidlStore],
    ...overrides
  };
}

describe('daily connector stores export script', () => {
  it('documents the live City Gross, Coop, Hemkop, ICA, Lidl, and Willys store catalog APIs used for branch metadata', () => {
    assert.match(script, /DEFAULT_ICA_STORE_CONFIGS/);
    assert.match(script, /fetchWillysStores/);
    assert.match(script, /fetchHemkopStores/);
    assert.match(script, /fetchCoopStores/);
    assert.match(script, /fetchCityGrossStores/);
    assert.match(script, /fetchLidlStores/);
    assert.match(script, /storesByChain/);
    assert.equal(
      pkg.scripts['ops:daily-connector-stores'],
      'npm run build -w @groceryview/ingestion && node scripts/ops/print-daily-connector-stores.mjs'
    );
  });

  it('self-test emits daily connector store metadata for supported branch-scoped chains', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test'], { encoding: 'utf8' });
    const body = JSON.parse(output);
    assert.deepEqual(body.supportedChains, ['ica', 'willys', 'hemkop', 'coop', 'city_gross', 'lidl']);
    assert.equal(body.storesByChain.ica[0].storeId, '1004599');
    assert.equal(body.storesByChain.willys[0].storeId, '2149');
    assert.equal(body.storesByChain.hemkop[0].storeId, '4798');
    assert.equal(body.storesByChain.coop[0].storeId, '196183');
    assert.equal(body.storesByChain.city_gross[0].storeId, '21');
    assert.equal(body.storesByChain.lidl[0].storeId, 'alingsas/vaenersborgsvaegen-21');
    for (const chain of body.supportedChains) {
      for (const store of body.storesByChain[chain]) {
        assert.equal(typeof store.storeId, 'string');
        assert.equal(typeof store.name, 'string');
        assert.equal(typeof store.address, 'string');
        assert.equal(typeof store.city, 'string');
      }
    }
  });

  it('retries transient store catalog fetch failures before failing the daily workflow', async () => {
    const { printDailyConnectorStores } = await import(scriptPath);
    let attempts = 0;

    const result = await printDailyConnectorStores({
      fetchers: baseFetchers({
        fetchCoopStores: async () => {
          attempts += 1;
          if (attempts === 1) throw new TypeError('fetch failed');
          return [coopStore];
        }
      }),
      retryBaseDelayMs: 0
    });

    assert.equal(attempts, 2);
    assert.equal(result.storesByChain.coop[0].storeId, '176110');
  });

  it('labels the failing chain when a store catalog cannot be exported', async () => {
    const { printDailyConnectorStores } = await import(scriptPath);

    await assert.rejects(
      () => printDailyConnectorStores({
        fetchers: baseFetchers({
          fetchLidlStores: async () => { throw new TypeError('fetch failed'); }
        }),
        retryAttempts: 0
      }),
      /lidl store catalog fetch failed: fetch failed/
    );
  });
});
