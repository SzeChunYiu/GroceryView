import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const scriptPath = new URL('../../scripts/ops/print-daily-connectors.mjs', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('daily connectors export script', () => {
  it('is exposed as an operator command for GROCERYVIEW_DAILY_CONNECTORS_JSON', () => {
    assert.equal(
      pkg.scripts['ops:daily-connectors'],
      'npm run build -w @groceryview/ingestion && node scripts/ops/print-daily-connectors.mjs'
    );
  });

  it('self-test emits native daily connector configs for all required chains with store coverage', () => {
    const output = execFileSync(process.execPath, [scriptPath.pathname, '--self-test'], { encoding: 'utf8' });
    const connectors = JSON.parse(output);
    assert.deepEqual(connectors.map((connector) => connector.chainId), [
      'ica',
      'willys',
      'willys',
      'coop',
      'coop',
      'hemkop',
      'hemkop',
      'lidl',
      'lidl',
      'city_gross',
      'mathem',
      'matspar',
      'pharmacy',
      'apoteket',
      'preem',
      'okq8',
      'ob-is'
    ]);
    assert.deepEqual(connectors.map((connector) => connector.connectorId), [
      'ica-store-promotions-default-stores',
      'willys-products-all-stores',
      'willys-weekly-all-stores',
      'coop-products-all-stores',
      'coop-weekly-all-stores',
      'hemkop-products-all-stores',
      'hemkop-weekly-all-stores',
      'lidl-public-offers-all-stores',
      'lidl-products-bulk',
      'city-gross-products-bulk',
      'mathem-public-search',
      'matspar-public-search',
      'pharmacy-public-products',
      'apoteket-se-public-products',
      'preem-se-business-list-prices',
      'okq8-fuel-prices',
      'ob-is-fuel-prices'
    ]);
    assert.equal(
      connectors
        .filter((connector) => connector.requireStoreScopedPrices !== false)
        .every((connector) => Array.isArray(connector.stores) && connector.stores.length > 0),
      true
    );
    const okq8FuelConnector = connectors.find((connector) => connector.connectorId === 'okq8-fuel-prices');
    assert.equal(okq8FuelConnector.domain, 'fuel');
    assert.equal(okq8FuelConnector.requireStoreScopedPrices, false);
    assert.deepEqual(okq8FuelConnector.stores, []);
    const matsparConnector = connectors.find((connector) => connector.connectorId === 'matspar-public-search');
    assert.equal(matsparConnector.domain, 'grocery');
    assert.equal(matsparConnector.requireStoreScopedPrices, false);
    assert.deepEqual(matsparConnector.stores, []);
    const mathemConnector = connectors.find((connector) => connector.connectorId === 'mathem-public-search');
    assert.equal(mathemConnector.domain, 'grocery');
    assert.equal(mathemConnector.requireStoreScopedPrices, false);
    assert.deepEqual(mathemConnector.stores, []);
    const pharmacyConnector = connectors.find((connector) => connector.connectorId === 'pharmacy-public-products');
    assert.equal(pharmacyConnector.domain, 'pharmacy');
    assert.equal(pharmacyConnector.requireStoreScopedPrices, false);
    assert.deepEqual(pharmacyConnector.stores, []);
    const apoteketConnector = connectors.find((connector) => connector.connectorId === 'apoteket-se-public-products');
    assert.equal(apoteketConnector.domain, 'pharmacy');
    assert.equal(apoteketConnector.requireStoreScopedPrices, false);
    assert.deepEqual(apoteketConnector.stores, []);
    const coopProductConnector = connectors.find((connector) => connector.connectorId === 'coop-products-all-stores');
    const coopWeeklyConnector = connectors.find((connector) => connector.connectorId === 'coop-weekly-all-stores');
    assert.deepEqual(coopProductConnector.stores.map((store) => store.storeId), ['176110']);
    assert.deepEqual(coopWeeklyConnector.stores.map((store) => store.storeId), ['196183', '176110']);
    const lidlBulkConnector = connectors.find((connector) => connector.connectorId === 'lidl-products-bulk');
    assert.equal(lidlBulkConnector.requireStoreScopedPrices, false);
    assert.deepEqual(lidlBulkConnector.stores, []);
    assert.deepEqual(connectors.map((connector) => connector.endpointUrl), [
      'groceryview://daily/ica/store-promotions/default-stores',
      'groceryview://daily/willys/products/all-stores',
      'groceryview://daily/willys/weekly-offers/all-stores',
      'groceryview://daily/coop/products/all-stores',
      'groceryview://daily/coop/weekly-offers/all-stores',
      'groceryview://daily/hemkop/products/all-stores',
      'groceryview://daily/hemkop/weekly-offers/all-stores',
      'groceryview://daily/lidl/public-offers/all-stores',
      'groceryview://daily/lidl/products/bulk',
      'groceryview://daily/city-gross/products/bulk',
      'groceryview://daily/mathem/products/public-search',
      'groceryview://daily/matspar/products/public-search',
      'groceryview://daily/pharmacy/products/public',
      'groceryview://daily/apoteket-se/products/public',
      'https://www.preem.se/foretag/listpriser/',
      'https://www.okq8.se/foretag/priser/',
      'https://olis.ob.is/eldsneytisverd'
    ]);
    assert.deepEqual(connectors.map((connector) => connector.parserVersion), [
      'ica-store-promotions-native-v1',
      'willys-products-native-v1',
      'willys-weekly-native-v1',
      'coop-products-native-v1',
      'coop-weekly-native-v1',
      'hemkop-products-native-v1',
      'hemkop-weekly-native-v1',
      'lidl-public-offers-native-v1',
      'lidl-bulk-native-v1',
      'citygross-bulk-native-v1',
      'mathem-public-search-v1',
      'matspar-public-search-v1',
      'pharmacy-public-products-v1',
      'apoteket-se-public-products-v1',
      'preem-se-business-list-v1',
      'okq8-fuel-prices-v1',
      'ob-is-fuel-prices-v1'
    ]);
  });
});
