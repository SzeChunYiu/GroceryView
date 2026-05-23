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
    connectorId: 'city-gross-public-products-all-stores',
    chainId: 'city_gross',
    sourceType: 'official_api',
    endpointUrl: 'groceryview://daily/city-gross/public-products/all-stores',
    parserVersion: 'citygross-products-native-v1',
    robotsTxtStatus: 'not_applicable',
    legalReviewStatus: 'approved',
    hasDataAgreement: true
  }
];

export async function printDailyConnectors({ selfTest = false, storesResult } = {}) {
  const storeExport = storesResult ?? await printDailyConnectorStores({ selfTest });
  return CONNECTOR_TEMPLATES.map((template) => {
    const stores = storeExport.storesByChain[template.chainId] ?? [];
    const connectorStores = typeof template.storeFilter === 'function' ? stores.filter(template.storeFilter) : stores;
    if (connectorStores.length === 0) throw new Error(`No daily connector stores exported for ${template.chainId}.`);
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
