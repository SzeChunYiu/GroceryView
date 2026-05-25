// AUTO-GENERATED from public ICA store-scoped promotions JSON.
// Source metadata: icaSources below records sourceUrl, retrievedAt, and rowCount for every store endpoint.
// Latest added sources:
// - https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300 (store 1004599 ICA Kvantum Kungsholmen, retrieved 2026-05-25T17:21:55.101Z, rows 300)
// - https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300 (store 1004247 ICA Focus, retrieved 2026-05-25T17:21:55.101Z, rows 300)
// - https://handlaprivatkund.ica.se/stores/1003714/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300 (store 1003714 ICA Karlaplan, retrieved 2026-05-25T17:21:55.101Z, rows 300)
// Row count: 97800 real product rows fetched from handlaprivatkund.ica.se across 326 store endpoints.
export type IcaIngestedProduct = {
  code: string;
  productId: string;
  retailerProductId: string;
  name: string;
  brand: string;
  categories: string[];
  imageUrl: string;
  productUrl: string;
  packageSize: string;
  countryOfOrigin: string;
  price: number | null;
  priceCurrency: string;
  unitPrice: number | null;
  unitPriceCurrency: string;
  unitPriceUnit: string;
  promoPrice: number | null;
  promoPriceCurrency: string;
  promoUnitPrice: number | null;
  promoUnitPriceCurrency: string;
  promoUnitPriceUnit: string;
  promotionDescription: string;
  memberOnly?: boolean;
  storeAccountId: string;
  storeName: string;
  regionId: string;
  sourceUrl: string;
  retrievedAt: string;
};

export const icaSources = [
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004599",
    "storeName": "ICA Kvantum Kungsholmen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004247",
    "storeName": "ICA Focus",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003714",
    "storeName": "ICA Karlaplan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003714/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004228",
    "storeName": "ICA Supermarket Fältöversten",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004228/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004222",
    "storeName": "ICA Kvantum Södermalm",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004222/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003754",
    "storeName": "ICA Supermarket Sjöstaden",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003754/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003380",
    "storeName": "Maxi ICA Stormarknad Solna",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003380/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1015001",
    "storeName": "Maxi ICA Stormarknad Bromma",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1015001/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004309",
    "storeName": "ICA Nära Annedal",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004309/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003898",
    "storeName": "ICA Kvantum Tyresö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003898/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003408",
    "storeName": "Maxi ICA Stormarknad Barkarbystaden",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003408/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004407",
    "storeName": "Maxi ICA Stormarknad Botkyrka",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004407/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003777",
    "storeName": "Maxi ICA Stormarknad Haninge",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003777/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004414",
    "storeName": "ICA Banér",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004414/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003855",
    "storeName": "ICA Supermarket Vanadis",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003855/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004315",
    "storeName": "ICA Nära Kallhäll",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004315/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1051011",
    "storeName": "Maxi ICA Stormarknad Österåker",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1051011/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003735",
    "storeName": "Maxi ICA Stormarknad Moraberg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003735/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003729",
    "storeName": "ICA Nära Brottbyhallen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003729/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004109",
    "storeName": "Maxi ICA Stormarknad Vasa Handelsplats",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004109/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003510",
    "storeName": "ICA Nära Enhörna, Södertälje",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003510/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003975",
    "storeName": "ICA Nära Lunda Livs",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003975/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003429",
    "storeName": "Maxi ICA Stormarknad Bålsta",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003429/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003421",
    "storeName": "Maxi ICA Stormarknad Nynäshamn",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003421/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003416",
    "storeName": "ICA Kvantum Knivsta",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003416/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003820",
    "storeName": "ICA Supermarket Torghallen, Mariefred",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003820/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003471",
    "storeName": "ICA Kvantum Rimbo",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003471/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003458",
    "storeName": "ICA Kvantum Ale",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003458/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003647",
    "storeName": "Maxi ICA Stormarknad Alingsås",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003647/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003644",
    "storeName": "ICA Nära Alexius Livs",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003644/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004242",
    "storeName": "ICA Supermarket Alfta",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004242/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003645",
    "storeName": "ICA Supermarket Algots Mönsterås",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003645/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004333",
    "storeName": "ICA Nära Alléns",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004333/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003650",
    "storeName": "ICA Nära Almunge",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003650/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003654",
    "storeName": "ICA Supermarket Alunda",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003654/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004219",
    "storeName": "Maxi ICA Stormarknad Göteborg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004219/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004589",
    "storeName": "ICA Kvantum Mölndal",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004589/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003954",
    "storeName": "Maxi ICA Stormarknad Högsbo, Göteborg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003954/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003825",
    "storeName": "Maxi ICA Stormarknad Torslanda",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003825/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003932",
    "storeName": "ICA Kvantum Hovås",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003932/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004392",
    "storeName": "Maxi ICA Stormarknad Kungälv",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004392/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004185",
    "storeName": "Maxi ICA Stormarknad Kungsbacka",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004185/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003398",
    "storeName": "ICA Kvantum Stenungsund",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003398/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003778",
    "storeName": "ICA Kvantum Frölunda",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003778/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004365",
    "storeName": "Maxi ICA Stormarknad Partille",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004365/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003383",
    "storeName": "ICA Kvantum Lerum",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003383/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003849",
    "storeName": "ICA Supermarket Hönö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003849/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003917",
    "storeName": "ICA Kvantum Kungsbacka",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003917/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004291",
    "storeName": "ICA Supermarket Nordeviks",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004291/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004520",
    "storeName": "ICA Supermarket Noltorp",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004520/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004490",
    "storeName": "ICA Kvantum Malmborgs Caroli",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004490/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003569",
    "storeName": "Maxi ICA Stormarknad Västra Hamnen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003569/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004037",
    "storeName": "ICA Kvantum Malmborgs Mobilia",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004037/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004492",
    "storeName": "Maxi ICA Stormarknad Malmö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004492/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003428",
    "storeName": "Maxi ICA Stormarknad Burlöv",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003428/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1088004",
    "storeName": "Maxi ICA Stormarknad Gunnesbo, Lund",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1088004/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004060",
    "storeName": "Maxi ICA Stormarknad Löddeköpinge",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004060/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003612",
    "storeName": "ICA Kvantum Karlssons",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003612/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003452",
    "storeName": "ICA Kvantum Södra Sandby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003452/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003620",
    "storeName": "Maxi ICA Stormarknad Trelleborg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003620/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004360",
    "storeName": "ICA Kvantum Sjöbo",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004360/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003916",
    "storeName": "Maxi ICA Stormarknad Råå Helsingborg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003916/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003793",
    "storeName": "ICA Kvantum Hörby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003793/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004458",
    "storeName": "ICA Supermarket Luthagens Livs",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004458/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004181",
    "storeName": "ICA Folkes Livs",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004181/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003386",
    "storeName": "ICA Nära Stabby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003386/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003426",
    "storeName": "ICA Supermarket Årstahallen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003426/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003871",
    "storeName": "ICA Kvantum Uppsala",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003871/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004488",
    "storeName": "Maxi ICA Stormarknad Stenhagen Uppsala",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004488/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003521",
    "storeName": "ICA Supermarket Sigtuna",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003521/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004562",
    "storeName": "ICA Kvantum Märsta",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004562/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004504",
    "storeName": "ICA Supermarket Bro",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004504/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003501",
    "storeName": "ICA Kvantum Väsby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003501/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004501",
    "storeName": "ICA Kvantum Vallentuna",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004501/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003415",
    "storeName": "Maxi ICA Stormarknad Häggvik",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003415/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003673",
    "storeName": "ICA Kvantum Sollentuna C",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003673/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1131004",
    "storeName": "Maxi ICA Stormarknad Arninge",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1131004/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004250",
    "storeName": "ICA Kvantum Täby C",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004250/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003723",
    "storeName": "ICA Supermarket Boström",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003723/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003490",
    "storeName": "ICA Rylander",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003490/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004380",
    "storeName": "Maxi ICA Stormarknad Enköping",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004380/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003784",
    "storeName": "ICA Supermarket Örbyhus",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003784/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004388",
    "storeName": "ICA Supermarket Stop Täby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004388/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003830",
    "storeName": "ICA Trevehallen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003830/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004531",
    "storeName": "ICA Supermarket Hässelby Torg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004531/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003442",
    "storeName": "ICA Supermarket Åkersberga Centrum",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003442/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004173",
    "storeName": "ICA Supermarket Favoriten",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004173/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004581",
    "storeName": "ICA Kvantum Mall of Scandinavia",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004581/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003586",
    "storeName": "ICA Supermarket Berga Centrum, Linköping",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003586/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003823",
    "storeName": "Maxi ICA Stormarknad Linköping",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003823/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004066",
    "storeName": "ICA Supermarket Rimforsa",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004066/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004546",
    "storeName": "ICA Supermarket Åtvidaberg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004546/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003556",
    "storeName": "ICA Supermarket Eneby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003556/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004539",
    "storeName": "ICA Nära Tjällmo handel",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004539/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004267",
    "storeName": "Maxi ICA Stormarknad Motala",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004267/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003690",
    "storeName": "ICA Kvantum Mirum Galleria, Norrköping",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003690/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1051010",
    "storeName": "Maxi ICA Stormarknad Norrköping",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1051010/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003461",
    "storeName": "ICA Supermarket Smedby, Norrköping",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003461/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004043",
    "storeName": "ICA Nära Boxholm",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004043/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004592",
    "storeName": "ICA Supermarket Söderköping",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004592/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003580",
    "storeName": "ICA Supermarket Kisa",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003580/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004084",
    "storeName": "Maxi ICA Stormarknad Helsingborg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004084/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003937",
    "storeName": "Maxi ICA Stormarknad Hyllinge",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003937/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003382",
    "storeName": "Maxi ICA Stormarknad Luleå",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003382/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004453",
    "storeName": "ICA Kvantum Stormarknad, Luleå",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004453/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004142",
    "storeName": "ICA Kvantum Boden",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004142/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003896",
    "storeName": "ICA Kvantum Piteå",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003896/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003828",
    "storeName": "Maxi ICA Stormarknad Umeå",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003828/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004229",
    "storeName": "ICA Kvantum Kronoparken",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004229/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004425",
    "storeName": "ICA Supermarket Sävar",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004425/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004559",
    "storeName": "ICA Nära Börsen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004559/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003602",
    "storeName": "ICA Supermarket Östra Husby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003602/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004034",
    "storeName": "Maxi ICA Stormarknad Katrineholm",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004034/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003392",
    "storeName": "ICA Supermarket Fyren",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003392/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004097",
    "storeName": "Maxi ICA Stormarknad Örebro Boglundsängen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004097/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003736",
    "storeName": "Maxi ICA Stormarknad Universitetet",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003736/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004364",
    "storeName": "ICA Kvantum Örebro",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004364/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003562",
    "storeName": "Maxi ICA Stormarknad Kumla",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003562/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004235",
    "storeName": "ICA Odenhallen, Odensbacken",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004235/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004335",
    "storeName": "ICA Supermarket Näsbyhallen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004335/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004564",
    "storeName": "ICA Supermarket Hallsberg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004564/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004536",
    "storeName": "ICA Supermarket Nora",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004536/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003883",
    "storeName": "ICA Supermarket Alvesta",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003883/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003551",
    "storeName": "ICA Nära Vilstahallen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003551/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1166011",
    "storeName": "Maxi ICA Stormarknad Arvika",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1166011/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004027",
    "storeName": "Maxi ICA Stormarknad Karlshamn",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004027/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004685",
    "storeName": "ICA Torghallen, Askersund",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004685/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004517",
    "storeName": "ICA Kvantum Avesta",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004517/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004061",
    "storeName": "ICA Supermarket Hagsätra",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004061/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003507",
    "storeName": "ICA Supermarket Bankeryd",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003507/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003704",
    "storeName": "ICA Supermarket Bjästa",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003704/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1051012",
    "storeName": "Maxi ICA Stormarknad Bollnäs",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1051012/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004119",
    "storeName": "Maxi ICA Stormarknad Borlänge",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004119/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004101",
    "storeName": "ICA City Knalleland",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004101/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003722",
    "storeName": "Maxi ICA Stormarknad Borås",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003722/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003705",
    "storeName": "ICA Nära Braås",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003705/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004093",
    "storeName": "ICA Nära Bredaryd",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004093/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004577",
    "storeName": "ICA Supermarket Brommaplan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004577/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003838",
    "storeName": "Maxi ICA Stormarknad Bromölla",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003838/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004056",
    "storeName": "ICA Nära Bräkne-Hoby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004056/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004098",
    "storeName": "ICA City Brämhult",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004098/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1037008",
    "storeName": "ICA Supermarket Charlottenberg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1037008/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004127",
    "storeName": "ICA Supermarket Delsbohallen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004127/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004290",
    "storeName": "ICA Supermarket Edsbyn",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004290/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003876",
    "storeName": "ICA Supermarket Tappström",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003876/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004151",
    "storeName": "ICA Supermarket Ekshärad",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004151/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004391",
    "storeName": "ICA Supermarket Eksjö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004391/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004469",
    "storeName": "ICA Supermarket Emmaboda",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004469/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003686",
    "storeName": "ICA Kvantum BEA Livsmedel",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003686/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004152",
    "storeName": "ICA Kvantum Ekängen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004152/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004413",
    "storeName": "ICA Supermarket Stenby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004413/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004513",
    "storeName": "Maxi ICA Stormarknad Eskilstuna",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004513/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004170",
    "storeName": "ICA Kvantum Falkenberg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004170/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003688",
    "storeName": "ICA Supermarket Skrea Strand",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003688/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003880",
    "storeName": "ICA Supermarket Falköping",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003880/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004508",
    "storeName": "ICA Supermarket Slätta",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004508/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003411",
    "storeName": "Maxi ICA Stormarknad Falun",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003411/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003412",
    "storeName": "ICA Kvantum Farsta",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003412/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004175",
    "storeName": "ICA Kvantum Filipstad",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004175/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003606",
    "storeName": "ICA Kvantum Flen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003606/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003837",
    "storeName": "ICA Supermarket Forshaga",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003837/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004100",
    "storeName": "ICA City Fristad",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004100/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003861",
    "storeName": "ICA Supermarket Vallhalla",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003861/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004069",
    "storeName": "ICA Supermarket Bunge",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004069/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003656",
    "storeName": "ICA Kvantum Färjestaden",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003656/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004214",
    "storeName": "ICA Kvantum Gislaved",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004214/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003868",
    "storeName": "ICA Supermarket Klingan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003868/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004349",
    "storeName": "ICA Nära Optimisten",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004349/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004551",
    "storeName": "ICA Kvantum Gällivare",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004551/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003610",
    "storeName": "ICA Nära Gällstad",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003610/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003587",
    "storeName": "ICA Nära Bomhus",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003587/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004534",
    "storeName": "ICA Supermarket Strömsbro",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004534/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1158001",
    "storeName": "Maxi ICA Stormarknad Brynäs",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1158001/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003987",
    "storeName": "Maxi ICA Stormarknad Gävle",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003987/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003764",
    "storeName": "ICA Supermarket Ettan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003764/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004211",
    "storeName": "ICA Nära Pettersberg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004211/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004356",
    "storeName": "ICA Nära Vallby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004356/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003869",
    "storeName": "ICA Kvantum Västerås",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003869/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004015",
    "storeName": "Maxi ICA Stormarknad Jönköping",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004015/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003919",
    "storeName": "ICA Nära Hovslätt",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003919/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003571",
    "storeName": "Maxi ICA Stormarknad Växjö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003571/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004593",
    "storeName": "ICA Kvantum Teleborg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004593/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003792",
    "storeName": "ICA Supermarket Hovshaga",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003792/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004519",
    "storeName": "ICA Supermarket Fanfaren",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004519/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004029",
    "storeName": "Maxi ICA Stormarknad Karlstad",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004029/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004584",
    "storeName": "ICA Kvantum Hammarö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004584/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003565",
    "storeName": "Maxi ICA Stormarknad Välsviken",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003565/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004396",
    "storeName": "ICA Kvantum Nacksta Sundsvall",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004396/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003423",
    "storeName": "Maxi ICA Stormarknad Sundsvall",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003423/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003884",
    "storeName": "ICA Kvantum Götene",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003884/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "00966",
    "storeName": "ICA Supermarket Matkassen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/00966/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003648",
    "storeName": "ICA Supermarket Söndrum",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003648/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003781",
    "storeName": "Maxi ICA Stormarknad Flygstaden",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003781/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003925",
    "storeName": "Maxi ICA Stormarknad Högskolan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003925/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003960",
    "storeName": "ICA Supermarket Skutan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003960/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004009",
    "storeName": "ICA Supermarket Högbyhallen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004009/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003453",
    "storeName": "ICA Supermarket Pärlan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003453/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003931",
    "storeName": "ICA Supermarket Hofors",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003931/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003996",
    "storeName": "ICA Supermarket Hovmantorp",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003996/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003430",
    "storeName": "Maxi ICA Stormarknad Flemingsberg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003430/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003414",
    "storeName": "Maxi ICA Stormarknad Hudiksvall",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003414/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004554",
    "storeName": "ICA Supermarket Telefonplan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004554/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003949",
    "storeName": "Maxi ICA Stormarknad Härnösand",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003949/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003545",
    "storeName": "Maxi ICA Stormarknad Hässleholm",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003545/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003951",
    "storeName": "ICA Kvantum Höganäs",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003951/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003395",
    "storeName": "ICA Supermarket Höör",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003395/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003446",
    "storeName": "ICA Supermarket Jämjö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003446/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003750",
    "storeName": "ICA Nära Järbo",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003750/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004514",
    "storeName": "ICA Supermarket Järvsö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004514/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004348",
    "storeName": "Maxi ICA Stormarknad Kalmar",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004348/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004523",
    "storeName": "ICA Supermarket Berga Centrum, Kalmar",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004523/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003977",
    "storeName": "ICA Supermarket Smedby, Kalmar",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003977/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003696",
    "storeName": "ICA Supermarket Lindsdal",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003696/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004441",
    "storeName": "ICA Skansen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004441/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003661",
    "storeName": "ICA Kvantum Nybro",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003661/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004194",
    "storeName": "ICA Nära Ålem",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004194/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004057",
    "storeName": "Maxi ICA Stormarknad Kristianstad",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004057/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004334",
    "storeName": "ICA Kvantum Kristianstad",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004334/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003905",
    "storeName": "ICA Kvantum Åhus",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003905/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004346",
    "storeName": "Maxi ICA Stormarknad Olofström",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004346/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003794",
    "storeName": "ICA Supermarket Osby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003794/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003966",
    "storeName": "ICA Supermarket Perstorp",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003966/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004362",
    "storeName": "ICA Supermarket Cityhallen Karlskrona",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004362/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004028",
    "storeName": "Maxi ICA Stormarknad Karlskrona",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004028/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003513",
    "storeName": "Maxi ICA Stormarknad Ronneby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003513/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004376",
    "storeName": "ICA Supermarket Lammhult",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004376/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004237",
    "storeName": "ICA Nära Ryd",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004237/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003597",
    "storeName": "ICA Supermarket Mullsjö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003597/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003785",
    "storeName": "ICA Supermarket Vaggeryd",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003785/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004704",
    "storeName": "Maxi ICA Stormarknad Karlskoga",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004704/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003404",
    "storeName": "ICA Supermarket Skåre",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003404/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003986",
    "storeName": "ICA Supermarket Kil",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003986/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004227",
    "storeName": "ICA Kvantum Kiruna",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004227/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004395",
    "storeName": "ICA Kvantum Klippan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004395/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004054",
    "storeName": "ICA Supermarket Kramfors",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004054/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004299",
    "storeName": "Maxi ICA Stormarknad Kristinehamn",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004299/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003679",
    "storeName": "ICA Supermarket Skeppet, Kungshamn",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003679/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004588",
    "storeName": "ICA Kvantum Kvissleby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004588/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004375",
    "storeName": "Maxi ICA Stormarknad Köping",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004375/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004688",
    "storeName": "ICA Supermarket Laxå",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004688/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004437",
    "storeName": "ICA Kvantum Lidingö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004437/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004493",
    "storeName": "ICA Nära Rudboda",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004493/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003833",
    "storeName": "ICA Supermarket Käppala",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003833/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004186",
    "storeName": "ICA Kvantum Hjertberg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004186/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004695",
    "storeName": "ICA Supermarket Margretelund",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004695/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004318",
    "storeName": "ICA Nära Likenäs Allköp",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004318/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004424",
    "storeName": "ICA Supermarket Lindesberg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004424/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004102",
    "storeName": "Maxi ICA Stormarknad Ljungby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004102/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004558",
    "storeName": "ICA Supermarket Ljungskile",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004558/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004594",
    "storeName": "ICA Kvantum Ludvika",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004594/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004459",
    "storeName": "ICA Supermarket Lycksele",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004459/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004460",
    "storeName": "ICA Supermarket Lysekil",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004460/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003614",
    "storeName": "ICA Supermarket Malung",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003614/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004565",
    "storeName": "ICA Supermarket Malå",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004565/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004572",
    "storeName": "ICA Nära Mathörnan, Mariannelund",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004572/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004044",
    "storeName": "ICA Kvantum Mariestad",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004044/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004499",
    "storeName": "ICA Kvantum Markaryd",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004499/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003804",
    "storeName": "ICA Supermarket Matfors",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003804/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004243",
    "storeName": "Maxi ICA Stormarknad Mellbystrand",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004243/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003419",
    "storeName": "Maxi ICA Stormarknad Mora",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003419/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003771",
    "storeName": "ICA Supermarket Munka Ljungby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003771/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004021",
    "storeName": "ICA Kvantum Sickla",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004021/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004282",
    "storeName": "Maxi ICA Stormarknad Nacka",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004282/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004289",
    "storeName": "ICA Supermarket Bommen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004289/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003532",
    "storeName": "ICA Kvantum Flygfyren",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003532/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004294",
    "storeName": "ICA Supermarket Norrköp",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004294/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004095",
    "storeName": "ICA Supermarket Nossebro",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004095/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004303",
    "storeName": "Maxi ICA Stormarknad Nyköping",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004303/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004590",
    "storeName": "ICA Kvantum Nässjö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004590/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003842",
    "storeName": "ICA Supermarket Ugglebo",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003842/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004340",
    "storeName": "Maxi ICA Stormarknad Oskarshamn",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004340/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003531",
    "storeName": "ICA Kvantum Oxelösund",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003531/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003474",
    "storeName": "ICA Supermarket Robertsfors",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003474/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004689",
    "storeName": "ICA Supermarket Salem",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004689/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003585",
    "storeName": "ICA Kvantum Åkrahallen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003585/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003806",
    "storeName": "ICA Nära Nyplan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003806/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004503",
    "storeName": "ICA Supermarket Björksätra",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004503/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003396",
    "storeName": "Maxi ICA Stormarknad Sandviken",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003396/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003463",
    "storeName": "ICA Supermarket Simrishamn",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003463/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004002",
    "storeName": "ICA Kvantum Skellefteå",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004002/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003910",
    "storeName": "Maxi ICA Stormarknad Skellefteå",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003910/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003746",
    "storeName": "ICA Nära Blomman",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003746/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004080",
    "storeName": "Maxi ICA Stormarknad Skövde",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004080/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004092",
    "storeName": "ICA Supermarket Sollebrunn",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004092/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004238",
    "storeName": "ICA Kvantum Sollefteå",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004238/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004420",
    "storeName": "ICA Nära Strandhallen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004420/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003417",
    "storeName": "ICA Kvantum Liljeholmen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003417/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003425",
    "storeName": "ICA Kvantum Värtan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003425/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003988",
    "storeName": "ICA Supermarket Aptiten",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003988/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004324",
    "storeName": "ICA Nära Riksten",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004324/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004509",
    "storeName": "ICA Nära Söråker",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004509/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004195",
    "storeName": "ICA Supermarket Vimmerby",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004195/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003971",
    "storeName": "ICA Supermarket Kärra",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003971/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003604",
    "storeName": "Maxi ICA Stormarknad Trollhättan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003604/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003475",
    "storeName": "ICA Supermarket Speceritjänst",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003475/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003424",
    "storeName": "Maxi ICA Stormarknad Värmdö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003424/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003816",
    "storeName": "ICA Tor Center",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003816/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003822",
    "storeName": "ICA Supermarket Toria",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003822/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003829",
    "storeName": "ICA Kvantum Tranås",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003829/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003911",
    "storeName": "ICA Nära Kilafors",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003911/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003787",
    "storeName": "ICA Supermarket Ystad",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003787/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003384",
    "storeName": "ICA Supermarket Anderstorp",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003384/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004579",
    "storeName": "ICA Supermarket Sundbyberg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004579/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004164",
    "storeName": "ICA Supermarket Esplanad, Sthlm",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004164/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004026",
    "storeName": "ICA Supermarket Kungsholmstorg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004026/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003933",
    "storeName": "ICA Supermarket Ringen, Sthlm",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003933/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004134",
    "storeName": "ICA Supermarket Sabbatsberg",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004134/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003418",
    "storeName": "Maxi ICA Stormarknad Lindhagen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003418/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003563",
    "storeName": "ICA Supermarket Väddö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003563/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1135007",
    "storeName": "ICA Supermarket Älta",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1135007/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004436",
    "storeName": "ICA Nära Älvsjö",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004436/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004477",
    "storeName": "ICA Supermarket Storuman",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004477/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003740",
    "storeName": "ICA Kvantum Strömstad",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003740/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004563",
    "storeName": "ICA Kvantum Säffle",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004563/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003751",
    "storeName": "ICA Supermarket BBB Sunne",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003751/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004393",
    "storeName": "ICA Supermarket Svenstavik",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004393/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004251",
    "storeName": "ICA Nära Sälen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004251/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004707",
    "storeName": "ICA Supermarket Lindvallen",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004707/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004032",
    "storeName": "ICA Nära Klingan",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004032/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003939",
    "storeName": "ICA Supermarket Hedemyrs",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003939/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004486",
    "storeName": "ICA Supermarket Tibro",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004486/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003693",
    "storeName": "ICA Supermarket Tierp",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003693/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004070",
    "storeName": "ICA Kvantum Tomelilla",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004070/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004281",
    "storeName": "ICA Supermarket Vagnhärad",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004281/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1004587",
    "storeName": "ICA Kvantum Kista",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1004587/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  },
  {
    "retrievedAt": "2026-05-25T17:21:55.101Z",
    "rowCount": 300,
    "storeAccountId": "1003801",
    "storeName": "ICA Kvantum Tidaholm",
    "regionId": "6ae1c52a-99a8-4b19-9464-dd01274df39d",
    "sourceUrl": "https://handlaprivatkund.ica.se/stores/1003801/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300"
  }
] as const;

import { icaProductsChunk000 } from './ica-products/chunk-000';
import { icaProductsChunk001 } from './ica-products/chunk-001';
import { icaProductsChunk002 } from './ica-products/chunk-002';
import { icaProductsChunk003 } from './ica-products/chunk-003';
import { icaProductsChunk004 } from './ica-products/chunk-004';
import { icaProductsChunk005 } from './ica-products/chunk-005';
import { icaProductsChunk006 } from './ica-products/chunk-006';
import { icaProductsChunk007 } from './ica-products/chunk-007';
import { icaProductsChunk008 } from './ica-products/chunk-008';
import { icaProductsChunk009 } from './ica-products/chunk-009';
import { icaProductsChunk010 } from './ica-products/chunk-010';
import { icaProductsChunk011 } from './ica-products/chunk-011';
import { icaProductsChunk012 } from './ica-products/chunk-012';
import { icaProductsChunk013 } from './ica-products/chunk-013';
import { icaProductsChunk014 } from './ica-products/chunk-014';
import { icaProductsChunk015 } from './ica-products/chunk-015';
import { icaProductsChunk016 } from './ica-products/chunk-016';
import { icaProductsChunk017 } from './ica-products/chunk-017';
import { icaProductsChunk018 } from './ica-products/chunk-018';
import { icaProductsChunk019 } from './ica-products/chunk-019';

export const icaProducts: IcaIngestedProduct[] = [
  ...icaProductsChunk000,
  ...icaProductsChunk001,
  ...icaProductsChunk002,
  ...icaProductsChunk003,
  ...icaProductsChunk004,
  ...icaProductsChunk005,
  ...icaProductsChunk006,
  ...icaProductsChunk007,
  ...icaProductsChunk008,
  ...icaProductsChunk009,
  ...icaProductsChunk010,
  ...icaProductsChunk011,
  ...icaProductsChunk012,
  ...icaProductsChunk013,
  ...icaProductsChunk014,
  ...icaProductsChunk015,
  ...icaProductsChunk016,
  ...icaProductsChunk017,
  ...icaProductsChunk018,
  ...icaProductsChunk019,
] as IcaIngestedProduct[];
