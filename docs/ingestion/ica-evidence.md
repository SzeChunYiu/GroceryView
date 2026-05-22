# ICA ingestion evidence

- Source: ICA public store-scoped promotions JSON
- Source URL: https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
- Retrieved: 2026-05-22T08:30:38.928Z
- Store: 1004599 ICA Kvantum Kungsholmen
- Region ID: 6ae1c52a-99a8-4b19-9464-dd01274df39d
- Real rows fetched: 100
- Connector: packages/ingestion/src/connectors/ica.ts
- Web wire: apps/web/src/lib/ingested/ica.ts

Every emitted row came from the live promotions response for the selected ICA store and includes the exact source URL plus retrieval timestamp. Rows preserve store account, region, ordinary price, unit price, promo price fields when ICA returned them, and product detail URLs.

## Sample Retrieved Rows

1. 2077461 | Babyplommontomater 500g Klass 1 ICA | price=37.9 SEK | promo=28 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
2. 2142371 | Ätmogen Avokado 3-pack Klass 1 ICA | price=40.6 SEK | promo=25 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
3. 1024181 | Falukorv Klassikern 800g Scan | price=39.7 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
4. 1319139 | Röd spetsig paprika 200g Klass 1 ICA | price=19.9 SEK | promo=15 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
5. 1131301 | Druvor Crimson Röda kärnfria 500g Klass 1  ICA | price=40.6 SEK | promo=28 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
6. 2014681 | Majs 3-p 480g Green Giant | price=28.6 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
7. 1201853 | Juice Apelsin 1l God Morgon® | price=27.4 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
8. 2092056 | Yoghurt Grekisk Naturell 10% 1000g Salakis | price=40.7 SEK | promo=25 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
9. 2161610 | Hamburgare 8-p 720g ICA | price=78.3 SEK | promo=70 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
10. 2014811 | Glassbåtar 6-p Sia Glass | price=49.2 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
11. 2016864 | Läsk 1,5l Trocadero Zero | price=18.9 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
12. 1477716 | Skinka Strimlad Rökt 180g ICA | price=22.2 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=100&maxPageSize=100
