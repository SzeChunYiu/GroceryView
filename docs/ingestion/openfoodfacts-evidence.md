# OpenFoodFacts ingestion evidence

- Source: official OpenFoodFacts world data export
- Source URL: https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
- Filter: countries_tags includes en:sweden, product_name_sv present, or Swedish language tag
- Retrieved: 2026-05-22T08:25:52.322Z
- Real rows fetched: 100
- Export rows scanned before completing sample: 397177
- Connector: packages/ingestion/src/connectors/openfoodfacts.ts
- Web wire: apps/web/src/lib/ingested/openfoodfacts.ts

The interactive OpenFoodFacts search endpoint returned temporary-unavailable HTML during probing on 2026-05-22, and per-product API probing hit HTTP 429 after a small number of real responses. The official data export linked from https://world.openfoodfacts.org/data streamed successfully, so this iteration uses that public export and filters for Swedish-relevant product records. Every emitted row includes its exact export source marker in `sourceUrl` and a product URL.

## Sample Retrieved Rows

1. 0000101266509 | Familjepack Schnitzel Frysta | Hälsans Kök | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=0000101266509
2. 0000101348123 | Focaccia Tomat | La Lorraine | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=0000101348123
3. 0000401406807 | Sweet Chilimayo | Olw | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=0000401406807
4. 00005322 | Piel De Sapo |  | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=00005322
5. 00009091 | cinelle vanilj |  | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=00009091
6. 00013029 | Cheddar | McDonald's | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=00013029
7. 0001500152459 | Cheddar | Coop | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=0001500152459
8. 0002545000798 | Deep Dish Pizza | Trenogmat | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=0002545000798
9. 0007317029275 | Hot & spicy  sausage sticks | Old wisconsin | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=0007317029275
10. 00073311 | Boeuf coreen | 5 ing | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=00073311
11. 00073317 | Potage poireaux | Ricardo | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=00073317
12. 0007340901417 | Flax Seed | Linaza | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=0007340901417
