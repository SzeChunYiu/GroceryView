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
    ...(store.conceptName ? { storeType: store.conceptName } : {})
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

async function loadStoreFetchers() {
  try {
    return await import('../../packages/ingestion/dist/index.js');
  } catch (error) {
    throw new Error(`Build @groceryview/ingestion before exporting live connector stores: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function printDailyConnectorStores({ fetchers, selfTest = false } = {}) {
  const source = fetchers ?? (selfTest ? {
    DEFAULT_ICA_STORE_CONFIGS: [{
      storeAccountId: '1004599',
      storeName: 'ICA Kvantum Kungsholmen',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      city: 'Stockholm'
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
      longitude: 16.213442
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

  const [willysStores, hemkopStores, coopStores, cityGrossStores, lidlStores] = await Promise.all([
    source.fetchWillysStores({ online: true }),
    source.fetchHemkopStores({ online: true }),
    source.fetchCoopStores(),
    source.fetchCityGrossStores(),
    source.fetchLidlStores()
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
