# OpenFoodFacts ingestion evidence

- Source: official OpenFoodFacts world data export
- Source URL: https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
- Retrieved: 2026-05-20T23:35:02.245Z
- Real rows fetched: 50
- Connector: packages/ingestion/src/connectors/openfoodfacts.ts
- Web wire: apps/web/src/lib/ingested/openfoodfacts.ts

The interactive OpenFoodFacts search endpoints returned temporary-unavailable HTML during probing, and per-product API requests began returning HTTP 429 before 50 rows. The official data export linked from https://world.openfoodfacts.org/data streamed successfully, so this iteration uses that public export. Every emitted row includes its exact export source marker in `sourceUrl` and a product URL.

## Sample Retrieved Rows

1. 0089686170269 | Instant Noodle Soup Vegetable Flavour | Indomie | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=0089686170269
2. 2000985644952 | Småfranska 10p | City Gross | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=2000985644952
3. 20645892 | Palmeritas | Sol&Mar, sol-mar | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=20645892
4. 4000417108104 | Crispy Cookie | Ritter Sport | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4000417108104
5. 4056489627821 | Vemondo veganska mandel glasspinnar | Bon Gelati, Lidl, Vemondo | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4056489627821
6. 4056489655664 | TK - Beerenmischung | Freshona | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4056489655664
7. 4056489687610 | Boisson au cacao et à l'avoine | Vemondo | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4056489687610
8. 4056489767930 | Matriket svenska fiberhavregryn | Matriket | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4056489767930
9. 5701977550974 | Ekologisk bredbart | Naturli' | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5701977550974
10. 59032823 | nutella | Ferrero,Nutellagg | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=59032823
11. 6416453043800 | Halloweenkuulat | Fazer | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=6416453043800
12. 6431901820321 | Flatbröd | Moilas | https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=6431901820321
