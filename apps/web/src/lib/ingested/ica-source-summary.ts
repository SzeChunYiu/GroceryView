// AUTO-GENERATED summary from public ICA store-scoped promotions JSON.
// Derived from apps/web/src/lib/ingested/ica.ts so visible routes can reference
// source metadata without bundling the 93k-row product fixture into every page.
export type IcaStorePromotionSourceSummary = {
  sourceLabel: string;
  generatedFrom: string;
  totalRowCount: number;
  storeEndpointCount: number;
  latestStores: {
    retrievedAt: string;
    rowCount: number;
    storeAccountId: string;
    storeName: string;
    regionId: string;
    sourceUrl: string;
  }[];
};

export const icaStorePromotionSourceSummary: IcaStorePromotionSourceSummary = {
  sourceLabel: 'ICA handlaprivatkund store-scoped promotions endpoints',
  generatedFrom: 'apps/web/src/lib/ingested/ica.ts',
  totalRowCount: 93083,
  storeEndpointCount: 323,
  latestStores: [
    {
      retrievedAt: '2026-05-23T13:26:35.000Z',
      rowCount: 10,
      storeAccountId: '1004070',
      storeName: 'ICA Kvantum Tomelilla',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1004070/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=10&maxPageSize=10'
    },
    {
      retrievedAt: '2026-05-23T12:44:17.000Z',
      rowCount: 10,
      storeAccountId: '1003693',
      storeName: 'ICA Supermarket Tierp',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1003693/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=10&maxPageSize=10'
    },
    {
      retrievedAt: '2026-05-23T12:01:00.690Z',
      rowCount: 10,
      storeAccountId: '1004587',
      storeName: 'ICA Kvantum Kista',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1004587/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=10&maxPageSize=10'
    },
    {
      retrievedAt: '2026-05-23T00:16:08.083Z',
      rowCount: 3,
      storeAccountId: '1003801',
      storeName: 'ICA Kvantum Tidaholm',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1003801/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=3&maxPageSize=3'
    },
    {
      retrievedAt: '2026-05-22T12:58:25.267Z',
      rowCount: 300,
      storeAccountId: '1004599',
      storeName: 'ICA Kvantum Kungsholmen',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300'
    },
    {
      retrievedAt: '2026-05-22T12:58:25.267Z',
      rowCount: 300,
      storeAccountId: '1004247',
      storeName: 'ICA Focus',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300'
    }
  ]
};
