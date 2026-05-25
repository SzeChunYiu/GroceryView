// AUTO-GENERATED summary from public ICA store-scoped promotions JSON.
// Derived from apps/web/src/lib/ingested/ica.ts so visible routes can reference
// source metadata without bundling the 87k-row product fixture into every page.
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
  totalRowCount: 87000,
  storeEndpointCount: 294,
  latestStores: [
    {
      retrievedAt: '2026-05-24T08:02:37.000Z',
      rowCount: 19,
      storeAccountId: '1003390',
      storeName: 'ICA Kvantum Jätten',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1003390/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=19&maxPageSize=19'
    },
    {
      retrievedAt: '2026-05-24T07:28:45.000Z',
      rowCount: 25,
      storeAccountId: '1003829',
      storeName: 'ICA Kvantum Tranås',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1003829/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=25&maxPageSize=25'
    },
    {
      retrievedAt: '2026-05-23T20:42:39.000Z',
      rowCount: 25,
      storeAccountId: '1003822',
      storeName: 'ICA Supermarket Toria',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1003822/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=25&maxPageSize=25'
    },
    {
      retrievedAt: '2026-05-22T12:58:25.267Z',
      rowCount: 150,
      storeAccountId: '1004599',
      storeName: 'ICA Kvantum Kungsholmen',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=150&maxPageSize=150'
    },
    {
      retrievedAt: '2026-05-22T12:58:25.267Z',
      rowCount: 300,
      storeAccountId: '1004247',
      storeName: 'ICA Focus',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300'
    },
    {
      retrievedAt: '2026-05-22T12:58:25.267Z',
      rowCount: 300,
      storeAccountId: '1003714',
      storeName: 'ICA Karlaplan',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1003714/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300'
    },
    {
      retrievedAt: '2026-05-22T12:58:25.267Z',
      rowCount: 300,
      storeAccountId: '1004228',
      storeName: 'ICA Supermarket Fältöversten',
      regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1004228/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300'
    }
  ]
};
