# OpenFoodFacts ingestion evidence

- Source: official OpenFoodFacts world data export
- Source URL: https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
- Retrieved: 2026-05-22T09:07:37.774Z
- Candidate barcode count checked from current Willys/Hemkop/Coop ingested rows: 277
- Real rows fetched: 147 barcode+nutrition rows matched to existing ingested retailer products
- Connector: packages/ingestion/src/connectors/openfoodfacts.ts
- Web wire: apps/web/src/lib/ingested/openfoodfacts.ts

The direct product API returned HTTP 429 during the 2026-05-22 probe. The official OpenFoodFacts export URL under `world.openfoodfacts.org/data` streamed successfully, so this iteration uses that public export. Candidate barcodes came only from current Willys/Hemkop/Coop ingested rows: Coop `ean` fields and Axfood EANs embedded in Willys/Hemkop image URLs. No-match and nutrition-empty products were skipped. Every emitted row includes its exact export source marker in `sourceUrl`, a product URL, and the retailer rows it matched by barcode.

## Sample Retrieved Rows

1. 3415581520927 | Fruit Collection | Häagen-Dazs | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3415581520927
2. 3523230062633 | Chèvre | Soignon | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3523230062633
3. 4016241051035 | Mild Kvarg Vanilj | Arla | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4016241051035
4. 4770513127216 | Kycklingbröst filé | TOP CHOICE POULTRY | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4770513127216
5. 5000112637939 | Coca-Cola Zero Sugar | Coca-Cola | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5000112637939
6. 5059319023229 | Frosties | Kellogg's, Kellogg's - KELLOG Company | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5059319023229
7. 5410673005847 | Ben's Original | Långkornigt | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5410673005847
8. 5410673005861 | Pitkäjyväinen riisi, keitetty | MARS NORGE AS | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5410673005861
9. 5740301203124 | Torskrygg | Royal Greenland | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5740301203124
10. 5900649083097 | Matcha latte | Mokate | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5900649083097
11. 6408432088933 | Valio Vanilj Original Slät | Valio, Valio Oy | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=6408432088933
12. 7300200630001 | Nötspett - Svartpeppar | Scan | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7300200630001
