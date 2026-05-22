# ICA ingestion evidence

- Source: ICA public store-scoped promotions JSON
- Source URL: https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
- Source URL: https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
- Retrieved (1004599 ICA Kvantum Kungsholmen): 2026-05-22T08:37:35.000Z
- Retrieved (1004247 ICA Focus): 2026-05-22T08:49:49.000Z
- Store: 1004599 ICA Kvantum Kungsholmen
- Store: 1004247 ICA Focus
- Region ID: 6ae1c52a-99a8-4b19-9464-dd01274df39d
- Real rows fetched: 400
- Connector: packages/ingestion/src/connectors/ica.ts
- Web wire: apps/web/src/lib/ingested/ica.ts

Every emitted row came from a live store-scoped promotions response for the selected ICA store and includes the exact source URL plus retrieval timestamp. Rows preserve store account, region, ordinary price, unit price, promo price fields when ICA returned them, promotion description, and product detail URLs.

## Sample Retrieved Rows

1. 1004599 ICA Kvantum Kungsholmen | 2077461 | Babyplommontomater 500g Klass 1 ICA | price=37.9 SEK | promo=28 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
2. 1004599 ICA Kvantum Kungsholmen | 2142371 | Ätmogen Avokado 3-pack Klass 1 ICA | price=40.6 SEK | promo=25 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
3. 1004599 ICA Kvantum Kungsholmen | 1024181 | Falukorv Klassikern 800g Scan | price=39.7 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
4. 1004599 ICA Kvantum Kungsholmen | 1319139 | Röd spetsig paprika 200g Klass 1 ICA | price=19.9 SEK | promo=15 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
5. 1004599 ICA Kvantum Kungsholmen | 1131301 | Druvor Crimson Röda kärnfria 500g Klass 1  ICA | price=40.6 SEK | promo=28 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
6. 1004599 ICA Kvantum Kungsholmen | 2014681 | Majs 3-p 480g Green Giant | price=28.6 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
7. 1004599 ICA Kvantum Kungsholmen | 1201853 | Juice Apelsin 1l God Morgon® | price=27.4 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
8. 1004599 ICA Kvantum Kungsholmen | 2092056 | Yoghurt Grekisk Naturell 10% 1000g Salakis | price=40.7 SEK | promo=25 SEK | https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
9. 1004247 ICA Focus | 2077461 | Babyplommontomater 500g Klass 1 ICA | price=37.9 SEK | promo=28 SEK | https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
10. 1004247 ICA Focus | 2142371 | Ätmogen Avokado 3-pack Klass 1 ICA | price=40.6 SEK | promo=25 SEK | https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
11. 1004247 ICA Focus | 1024181 | Falukorv Klassikern 800g Scan | price=39.7 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
12. 1004247 ICA Focus | 1319139 | Röd spetsig paprika 200g Klass 1 ICA | price=19.9 SEK | promo=15 SEK | https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
13. 1004247 ICA Focus | 1131301 | Druvor Crimson Röda kärnfria 500g Klass 1  ICA | price=40.6 SEK | promo=28 SEK | https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
14. 1004247 ICA Focus | 2014681 | Majs 3-p 480g Green Giant | price=28.6 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
15. 1004247 ICA Focus | 1201853 | Juice Apelsin 1l God Morgon® | price=27.4 SEK | promo=  | https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
16. 1004247 ICA Focus | 2092056 | Yoghurt Grekisk Naturell 10% 1000g Salakis | price=40.7 SEK | promo=25 SEK | https://handlaprivatkund.ica.se/stores/1004247/api/product-listing-pages/v1/pages/promotions?regionId=6ae1c52a-99a8-4b19-9464-dd01274df39d&includeAdditionalPageInfo=true&maxProductsToDecorate=200&maxPageSize=200
