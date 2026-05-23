#!/usr/bin/env node
import process from 'node:process';

function toDailyStoreConfig(store) {
  return {
    storeId: store.storeId,
    name: store.name,
    address: store.address || store.name,
    city: store.city,
    countryCode: store.countryCode ?? 'SE',
    ...(store.latitude === null || store.latitude === undefined ? {} : { latitude: store.latitude }),
    ...(store.longitude === null || store.longitude === undefined ? {} : { longitude: store.longitude }),
    ...(store.conceptName ? { storeType: store.conceptName } : {}),
    ...(typeof store.supportsOnlineProductPrices === 'boolean' ? { supportsOnlineProductPrices: store.supportsOnlineProductPrices } : {})
  };
}

function icaStoreToDailyStoreConfig(store) {
  return {
    storeId: store.storeAccountId,
    name: store.storeName,
    address: store.storeName,
    city: store.city ?? 'Sweden',
    countryCode: 'SE'
  };
}


function storeFetchErrorMessage(chainId, error) {
  return `${chainId} store catalog fetch failed: ${error instanceof Error ? error.message : String(error)}`;
}

async function waitForRetryDelay(delayMs) {
  if (!delayMs || delayMs <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function fetchStoreCatalogWithRetry(chainId, fetchStoreCatalog, { retryAttempts = 2, retryBaseDelayMs = 250 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
    try {
      return await fetchStoreCatalog();
    } catch (error) {
      lastError = error;
      if (attempt >= retryAttempts) break;
      process.stderr.write(`[daily-connectors] retrying ${chainId} store catalog fetch attempt=${attempt + 2}/${retryAttempts + 1}: ${error instanceof Error ? error.message : String(error)}
`);
      await waitForRetryDelay(retryBaseDelayMs * (attempt + 1));
    }
  }
  throw new Error(storeFetchErrorMessage(chainId, lastError));
}

async function loadStoreFetchers() {
  try {
    return await import('../../packages/ingestion/dist/index.js');
  } catch (error) {
    throw new Error(`Build @groceryview/ingestion before exporting live connector stores: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function printDailyConnectorStores({ fetchers, selfTest = false, retryAttempts = 2, retryBaseDelayMs = 250 } = {}) {
  const source = fetchers ?? (selfTest ? {
    DEFAULT_ICA_STORE_CONFIGS: [{
      storeAccountId: '1004599',
      storeName: 'ICA Kvantum Kungsholmen',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      city: 'Stockholm'
    }, {
      storeAccountId: '1003380',
      storeName: 'Maxi ICA Stormarknad Solna',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      city: 'Solna'
    }],
    fetchWillysStores: async () => [{
      storeId: '2149',
      name: 'Willys Alingsås Hagaplan',
      address: 'Hagaplan',
      city: 'Alingsås',
      countryCode: 'SE',
      latitude: 57.9374,
      longitude: 12.5333
    }],
    fetchHemkopStores: async () => [{
      storeId: '4798',
      name: 'Hemköp Bollnäs',
      address: 'Långgatan 10',
      city: 'Bollnäs',
      countryCode: 'SE',
      latitude: 61.3461,
      longitude: 16.0543
    }],
    fetchCoopStores: async () => [{
      storeId: '196183',
      name: 'Coop Krylbo',
      conceptName: 'Coop',
      address: 'Järnvägsgatan 16',
      city: 'Krylbo',
      latitude: 60.1307271,
      longitude: 16.213442,
      supportsOnlineProductPrices: false
    }, {
      storeId: '176110',
      name: 'Coop City Hallsberg',
      conceptName: 'Coop',
      address: 'Trädgårdsgatan 6',
      city: 'Hallsberg',
      latitude: 59.0649672,
      longitude: 15.1129595,
      supportsOnlineProductPrices: true
    }],
    fetchCityGrossStores: async () => [{
      storeId: '21',
      name: 'City Gross Borås',
      address: '',
      city: 'Borås',
      latitude: 57.7141742,
      longitude: 12.8669819
    }],
    fetchLidlStores: async () => [{
      storeId: 'alingsas/vaenersborgsvaegen-21',
      name: 'Lidl Alingsås Vänersborgsvägen 21',
      address: 'Vänersborgsvägen 21',
      city: 'Alingsås',
      countryCode: 'SE',
      latitude: 57.93452,
      longitude: 12.54588
    }]
  } : await loadStoreFetchers());

  const retryOptions = { retryAttempts, retryBaseDelayMs };
  const [willysStores, hemkopStores, coopStores, cityGrossStores, lidlStores] = await Promise.all([
    fetchStoreCatalogWithRetry('willys', () => source.fetchWillysStores({ online: true }), retryOptions),
    fetchStoreCatalogWithRetry('hemkop', () => source.fetchHemkopStores({ online: true }), retryOptions),
    fetchStoreCatalogWithRetry('coop', () => source.fetchCoopStores(), retryOptions),
    fetchStoreCatalogWithRetry('city_gross', () => source.fetchCityGrossStores(), retryOptions),
    fetchStoreCatalogWithRetry('lidl', () => source.fetchLidlStores(), retryOptions)
  ]);

  return {
    generatedAt: new Date().toISOString(),
    supportedChains: ['ica', 'willys', 'hemkop', 'coop', 'city_gross', 'lidl'],
    storesByChain: {
      ica: source.DEFAULT_ICA_STORE_CONFIGS.map(icaStoreToDailyStoreConfig),
      willys: willysStores.map(toDailyStoreConfig),
      hemkop: hemkopStores.map(toDailyStoreConfig),
      coop: coopStores.map(toDailyStoreConfig),
      city_gross: cityGrossStores.map(toDailyStoreConfig),
      lidl: lidlStores.map(toDailyStoreConfig)
    }
  };
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const result = await printDailyConnectorStores({ selfTest: process.argv.includes('--self-test') });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
