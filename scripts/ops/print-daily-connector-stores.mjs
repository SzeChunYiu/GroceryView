#!/usr/bin/env node
import process from 'node:process';

function toDailyStoreConfig(store) {
  return {
    storeId: store.storeId,
    name: store.name,
    address: store.address,
    city: store.city,
    countryCode: store.countryCode ?? 'SE',
    ...(store.latitude === null || store.latitude === undefined ? {} : { latitude: store.latitude }),
    ...(store.longitude === null || store.longitude === undefined ? {} : { longitude: store.longitude }),
    ...(store.conceptName ? { storeType: store.conceptName } : {})
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
    fetchWillysStores: async () => [{
      storeId: '2149',
      name: 'Willys Alingsås Hagaplan',
      address: 'Hagaplan',
      city: 'Alingsås',
      countryCode: 'SE',
      latitude: 57.9374,
      longitude: 12.5333
    }],
    fetchCoopStores: async () => [{
      storeId: '196183',
      name: 'Coop Krylbo',
      conceptName: 'Coop',
      address: 'Järnvägsgatan 16',
      city: 'Krylbo',
      latitude: 60.1307271,
      longitude: 16.213442
    }]
  } : await loadStoreFetchers());

  const [willysStores, coopStores] = await Promise.all([
    source.fetchWillysStores({ online: true }),
    source.fetchCoopStores()
  ]);

  return {
    generatedAt: new Date().toISOString(),
    supportedChains: ['willys', 'coop'],
    storesByChain: {
      willys: willysStores.map(toDailyStoreConfig),
      coop: coopStores.map(toDailyStoreConfig)
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
