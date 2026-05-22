# ICA ingestion evidence

- Source: ICA public store-scoped promotions JSON
- Source URL: https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
- Source URL: https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
- Source URL: https://handlaprivatkund.ica.se/stores/1003714/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
- Source URL: https://handlaprivatkund.ica.se/stores/1004228/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
- Source URL: https://handlaprivatkund.ica.se/stores/1004222/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
- Source URL: https://handlaprivatkund.ica.se/stores/1003754/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
- Source URL: https://handlaprivatkund.ica.se/stores/1003380/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
- Source URL: https://handlaprivatkund.ica.se/stores/1015001/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
- Store locator source: https://handla.ica.se/api/store/v1?latitude=59.3293&longitude=18.0686&customerType=B2C
- Store locator retrieved: 2026-05-22T09:44:40.729Z
- Retrieved (1004599 ICA Kvantum Kungsholmen): 2026-05-22T09:16:04.478Z
- Retrieved (1004247 ICA Focus): 2026-05-22T09:16:05.062Z
- Retrieved (1003714 ICA Karlaplan): 2026-05-22T09:16:05.436Z
- Retrieved (1004228 ICA Supermarket Fältöversten): 2026-05-22T09:16:05.775Z
- Retrieved (1004222 ICA Kvantum Södermalm): 2026-05-22T09:24:48.000Z
- Retrieved (1003754 ICA Supermarket Sjöstaden): 2026-05-22T09:44:05.540Z
- Retrieved (1003380 Maxi ICA Stormarknad Solna): 2026-05-22T09:44:06.303Z
- Retrieved (1015001 Maxi ICA Stormarknad Bromma): 2026-05-22T09:44:07.767Z
- Store: 1004599 ICA Kvantum Kungsholmen
- Store: 1004247 ICA Focus
- Store: 1003714 ICA Karlaplan
- Store: 1004228 ICA Supermarket Fältöversten
- Store: 1004222 ICA Kvantum Södermalm
- Store: 1003754 ICA Supermarket Sjöstaden
- Store: 1003380 Maxi ICA Stormarknad Solna
- Store: 1015001 Maxi ICA Stormarknad Bromma
- Region ID: 6ae1c52a-99a8-4b19-9464-dd01274df39d
- Real rows fetched: 2400
- Connector: packages/ingestion/src/connectors/ica.ts
- Web wire: apps/web/src/lib/ingested/ica.ts

Every emitted row came from a live store-scoped promotions response for the selected ICA store and includes the exact source URL plus retrieval timestamp. Store account ids for ICA Karlaplan, ICA Supermarket Fältöversten, ICA Kvantum Södermalm, ICA Supermarket Sjöstaden, Maxi ICA Stormarknad Solna, and Maxi ICA Stormarknad Bromma were selected from the public ICA store locator response. Rows preserve store account, region, ordinary price, unit price, promo price fields when ICA returned them, promotion description, and product detail URLs.

## Sample Retrieved Rows

1. 1004599 ICA Kvantum Kungsholmen | 2077461 | Babyplommontomater 500g Klass 1 ICA | price=37.9 SEK | promo=28 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
2. 1004599 ICA Kvantum Kungsholmen | 2142371 | Ätmogen Avokado 3-pack Klass 1 ICA | price=40.6 SEK | promo=25 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
3. 1004599 ICA Kvantum Kungsholmen | 1024181 | Falukorv Klassikern 800g Scan | price=39.7 SEK | promo= | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
4. 1004599 ICA Kvantum Kungsholmen | 1319139 | Röd spetsig paprika 200g Klass 1 ICA | price=19.9 SEK | promo=15 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
5. 1004599 ICA Kvantum Kungsholmen | 1131301 | Druvor Crimson Röda kärnfria 500g Klass 1  ICA | price=40.6 SEK | promo=28 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
6. 1004599 ICA Kvantum Kungsholmen | 2014681 | Majs 3-p 480g Green Giant | price=28.6 SEK | promo= | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
7. 1004599 ICA Kvantum Kungsholmen | 1201853 | Juice Apelsin 1l God Morgon® | price=27.4 SEK | promo= | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
8. 1004599 ICA Kvantum Kungsholmen | 2092056 | Yoghurt Grekisk Naturell 10% 1000g Salakis | price=40.7 SEK | promo=25 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
9. 1003754 ICA Supermarket Sjöstaden | 2077461 | Babyplommontomater 500g Klass 1 ICA | price=37.9 SEK | promo=28 SEK | https://handlaprivatkund.ica.se/stores/1003754/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
10. 1003754 ICA Supermarket Sjöstaden | 2142371 | Ätmogen Avokado 3-pack Klass 1 ICA | price=40.6 SEK | promo=17.5 SEK | https://handlaprivatkund.ica.se/stores/1003754/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
11. 1003754 ICA Supermarket Sjöstaden | 1024181 | Falukorv Klassikern 800g Scan | price=39.7 SEK | promo= | https://handlaprivatkund.ica.se/stores/1003754/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
12. 1003754 ICA Supermarket Sjöstaden | 1319139 | Röd spetsig paprika 200g Klass 1 ICA | price=19.9 SEK | promo=15 SEK | https://handlaprivatkund.ica.se/stores/1003754/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
13. 1003754 ICA Supermarket Sjöstaden | 1131301 | Druvor Crimson Röda kärnfria 500g Klass 1  ICA | price=40.6 SEK | promo=28 SEK | https://handlaprivatkund.ica.se/stores/1003754/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
14. 1003754 ICA Supermarket Sjöstaden | 2014681 | Majs 3-p 480g Green Giant | price=28.6 SEK | promo= | https://handlaprivatkund.ica.se/stores/1003754/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
15. 1003754 ICA Supermarket Sjöstaden | 1201853 | Juice Apelsin 1l God Morgon® | price=27.4 SEK | promo= | https://handlaprivatkund.ica.se/stores/1003754/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
16. 1003754 ICA Supermarket Sjöstaden | 2092056 | Yoghurt Grekisk Naturell 10% 1000g Salakis | price=40.7 SEK | promo=25 SEK | https://handlaprivatkund.ica.se/stores/1003754/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=300&maxPageSize=300
