#!/usr/bin/env node
import process from 'node:process';
import { printDailyConnectorStores } from './print-daily-connector-stores.mjs';

const CONNECTOR_TEMPLATES = [
  {
    connectorId: 'ica-store-promotions-default-stores',
    chainId: 'ica',
    sourceType: 'official_api',
    endpointUrl: 'groceryview://daily/ica/store-promotions/default-stores',
    parserVersion: 'ica-store-promotions-native-v1',
    robotsTxtStatus: 'not_applicable',
    legalReviewStatus: 'approved',
    hasDataAgreement: true
  },
  {
    connectorId: 'willys-products-all-stores',
    chainId: 'willys',
    sourceType: 'official_api',
    endpointUrl: 'groceryview://daily/willys/products/all-stores',
    parserVersion: 'willys-products-native-v1',
    robotsTxtStatus: 'not_applicable',
    legalReviewStatus: 'approved',
    hasDataAgreement: true
  },
  {
    connectorId: 'willys-weekly-all-stores',
    chainId: 'willys',
    sourceType: 'flyer_campaign',
    endpointUrl: 'groceryview://daily/willys/weekly-offers/all-stores',
    parserVersion: 'willys-weekly-native-v1',
    robotsTxtStatus: 'not_applicable',
    legalReviewStatus: 'approved',
    hasDataAgreement: true
  },
  {
    connectorId: 'coop-products-all-stores',
    chainId: 'coop',
    sourceType: 'official_api',
    endpointUrl: 'groceryview://daily/coop/products/all-stores',
    parserVersion: 'coop-products-native-v1',
    robotsTxtStatus: 'not_applicable',
    legalReviewStatus: 'approved',
    hasDataAgreement: true,
    storeFilter: (store) => store.supportsOnlineProductPrices === true
  },
  {
    connectorId: 'coop-weekly-all-stores',
    chainId: 'coop',
    sourceType: 'flyer_campaign',
    endpointUrl: 'groceryview://daily/coop/weekly-offers/all-stores',
    parserVersion: 'coop-weekly-native-v1',
    robotsTxtStatus: 'not_applicable',
    legalReviewStatus: 'approved',
    hasDataAgreement: true
  },
  {
    connectorId: 'hemkop-products-all-stores',
    chainId: 'hemkop',
    sourceType: 'official_api',
    endpointUrl: 'groceryview://daily/hemkop/products/all-stores',
    parserVersion: 'hemkop-products-native-v1',
    robotsTxtStatus: 'not_applicable',
    legalReviewStatus: 'approved',
    hasDataAgreement: true
  },
  {
    connectorId: 'hemkop-weekly-all-stores',
    chainId: 'hemkop',
    sourceType: 'flyer_campaign',
    endpointUrl: 'groceryview://daily/hemkop/weekly-offers/all-stores',
    parserVersion: 'hemkop-weekly-native-v1',
    robotsTxtStatus: 'not_applicable',
    legalReviewStatus: 'approved',
    hasDataAgreement: true
  },
  {
    connectorId: 'lidl-public-offers-all-stores',
    chainId: 'lidl',
    sourceType: 'retailer_online_page',
    endpointUrl: 'groceryview://daily/lidl/public-offers/all-stores',
    parserVersion: 'lidl-public-offers-native-v1',
    robotsTxtStatus: 'allow',
    legalReviewStatus: 'approved',
    hasDataAgreement: true
  },
  {
    connectorId: 'city-gross-products-bulk',
    chainId: 'city_gross',
    sourceType: 'official_api',
    endpointUrl: 'groceryview://daily/city-gross/products/bulk',
    parserVersion: 'citygross-bulk-native-v1',
    robotsTxtStatus: 'not_applicable',
    legalReviewStatus: 'approved',
    hasDataAgreement: true
  },
  {
    connectorId: 'mathem-public-search',
    chainId: 'mathem',
    domain: 'grocery',
    sourceType: 'retailer_online_page',
    endpointUrl: 'groceryview://daily/mathem/products/public-search',
    parserVersion: 'mathem-public-search-v1',
    robotsTxtStatus: 'allow',
    legalReviewStatus: 'approved',
    hasDataAgreement: false,
    requireStoreScopedPrices: false,
    stores: []
  },
  {
    connectorId: 'matspar-public-search',
    chainId: 'matspar',
    domain: 'grocery',
    sourceType: 'retailer_online_page',
    endpointUrl: 'groceryview://daily/matspar/products/public-search',
    parserVersion: 'matspar-public-search-v1',
    robotsTxtStatus: 'allow',
    legalReviewStatus: 'approved',
    hasDataAgreement: false,
    requireStoreScopedPrices: false,
    stores: []
  },
  {
    connectorId: 'pharmacy-public-products',
    chainId: 'pharmacy',
    domain: 'pharmacy',
    sourceType: 'retailer_online_page',
    endpointUrl: 'groceryview://daily/pharmacy/products/public',
    parserVersion: 'pharmacy-public-products-v1',
    robotsTxtStatus: 'allow',
    legalReviewStatus: 'approved',
    hasDataAgreement: false,
    requireStoreScopedPrices: false,
    stores: []
  },
  {
    connectorId: 'apoteket-se-public-products',
    chainId: 'apoteket',
    domain: 'pharmacy',
    sourceType: 'retailer_online_page',
    endpointUrl: 'groceryview://daily/apoteket-se/products/public',
    parserVersion: 'apoteket-se-public-products-v1',
    robotsTxtStatus: 'allow',
    legalReviewStatus: 'approved',
    hasDataAgreement: false,
    requireStoreScopedPrices: false,
    stores: []
  },
  {
    connectorId: 'okq8-fuel-prices',
    chainId: 'okq8',
    domain: 'fuel',
    sourceType: 'retailer_online_page',
    endpointUrl: 'https://www.okq8.se/foretag/priser/',
    parserVersion: 'okq8-fuel-prices-v1',
    robotsTxtStatus: 'allow',
    legalReviewStatus: 'approved',
    hasDataAgreement: false,
    requireStoreScopedPrices: false,
    stores: []
  },
  {
    connectorId: 'ob-is-fuel-prices',
    chainId: 'ob-is',
    domain: 'fuel',
    sourceType: 'retailer_online_page',
    endpointUrl: 'https://olis.ob.is/eldsneytisverd',
    parserVersion: 'ob-is-fuel-prices-v1',
    robotsTxtStatus: 'allow',
    legalReviewStatus: 'approved',
    hasDataAgreement: false,
    requireStoreScopedPrices: false,
    stores: []
  }
];

export async function printDailyConnectors({ selfTest = false, storesResult } = {}) {
  const storeExport = storesResult ?? await printDailyConnectorStores({ selfTest });
  return CONNECTOR_TEMPLATES.map((template) => {
    const stores = storeExport.storesByChain[template.chainId] ?? [];
    const connectorStores = Array.isArray(template.stores)
      ? template.stores
      : typeof template.storeFilter === 'function'
        ? stores.filter(template.storeFilter)
        : stores;
    if (connectorStores.length === 0 && template.requireStoreScopedPrices !== false) {
      throw new Error(`No daily connector stores exported for ${template.chainId}.`);
    }
    const { storeFilter: _storeFilter, ...connector } = template;
    return { ...connector, stores: connectorStores };
  });
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const result = await printDailyConnectors({ selfTest: process.argv.includes('--self-test') });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
