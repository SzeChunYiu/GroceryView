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
      'city_gross',
      'mathem',
      'matspar',
      'seven_eleven_se',
      'pharmacy',
      'okq8'
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
      'city-gross-products-bulk',
      'mathem-public-search',
      'matspar-public-search',
      'seven-eleven-se-convenience-products',
      'pharmacy-public-products',
      'okq8-fuel-prices'
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
    const sevenElevenConnector = connectors.find((connector) => connector.connectorId === 'seven-eleven-se-convenience-products');
    assert.equal(sevenElevenConnector.domain, 'grocery');
    assert.equal(sevenElevenConnector.requireStoreScopedPrices, false);
    assert.deepEqual(sevenElevenConnector.stores, []);
    const mathemConnector = connectors.find((connector) => connector.connectorId === 'mathem-public-search');
    assert.equal(mathemConnector.domain, 'grocery');
    assert.equal(mathemConnector.requireStoreScopedPrices, false);
    assert.deepEqual(mathemConnector.stores, []);
    const pharmacyConnector = connectors.find((connector) => connector.connectorId === 'pharmacy-public-products');
    assert.equal(pharmacyConnector.domain, 'pharmacy');
    assert.equal(pharmacyConnector.requireStoreScopedPrices, false);
    assert.deepEqual(pharmacyConnector.stores, []);
    const coopProductConnector = connectors.find((connector) => connector.connectorId === 'coop-products-all-stores');
    const coopWeeklyConnector = connectors.find((connector) => connector.connectorId === 'coop-weekly-all-stores');
    assert.deepEqual(coopProductConnector.stores.map((store) => store.storeId), ['176110']);
    assert.deepEqual(coopWeeklyConnector.stores.map((store) => store.storeId), ['196183', '176110']);
    assert.deepEqual(connectors.map((connector) => connector.endpointUrl), [
      'groceryview://daily/ica/store-promotions/default-stores',
      'groceryview://daily/willys/products/all-stores',
      'groceryview://daily/willys/weekly-offers/all-stores',
      'groceryview://daily/coop/products/all-stores',
      'groceryview://daily/coop/weekly-offers/all-stores',
      'groceryview://daily/hemkop/products/all-stores',
      'groceryview://daily/hemkop/weekly-offers/all-stores',
      'groceryview://daily/lidl/public-offers/all-stores',
      'groceryview://daily/city-gross/products/bulk',
      'groceryview://daily/mathem/products/public-search',
      'groceryview://daily/matspar/products/public-search',
      'https://7-eleven.se/vart-sortiment/',
      'groceryview://daily/pharmacy/products/public',
      'https://www.okq8.se/foretag/priser/'
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
      'citygross-bulk-native-v1',
      'mathem-public-search-v1',
      'matspar-public-search-v1',
      'seven-eleven-se-sortiment-v1',
      'pharmacy-public-products-v1',
      'okq8-fuel-prices-v1'
    ]);
  });
});
