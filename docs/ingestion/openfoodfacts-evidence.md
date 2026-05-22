# OpenFoodFacts ingestion evidence

- Source: official OpenFoodFacts world data export
- Source URL: https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
- Retrieved: 2026-05-22T09:54:39.728Z
- Candidate barcode count checked from current Willys/Hemkop/Coop ingested rows: 786
- Real rows fetched: 404 barcode+nutrition rows matched to existing ingested retailer products
- Connector: packages/ingestion/src/connectors/openfoodfacts.ts
- Web wire: apps/web/src/lib/ingested/openfoodfacts.ts

The direct product API returned HTTP 429 during the 2026-05-22 probe. The official OpenFoodFacts export URL under `world.openfoodfacts.org/data` streamed successfully, so this iteration uses that public export. Candidate barcodes came only from current Willys/Hemkop/Coop ingested rows: Coop `ean` fields and Axfood EANs embedded in Willys/Hemkop image URLs. No-match and nutrition-empty products were skipped. Every emitted row includes its exact export source marker in `sourceUrl`, a product URL, and the retailer rows it matched by barcode.

## Verification

- Verified: 2026-05-22T10:21:01Z
- Export join path: `fetchOpenFoodFactsExportRetailerEnrichments`
- Unit coverage: `fetchOpenFoodFactsExportRetailerEnrichments` joins only retailer candidate barcodes from the export and skips nutrition-empty rows.
- Artifact audit: `rowCount` 404 equals 404 emitted barcode rows; all 404 barcodes are unique; `candidateBarcodeCount` 786 equals the 786 unique usable current Willys/Hemkop/Coop candidate barcodes; every emitted barcode appears in those current candidates; zero emitted rows have empty nutrition; zero emitted rows use a source outside `https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=...`.

## Sample Retrieved Rows

1. 2340398000007 | Ost Gräddis | ARLa | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=2340398000007
2. 3415581520927 | Fruit Collection | Häagen-Dazs | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3415581520927
3. 3523230062633 | Chèvre | Soignon | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3523230062633
4. 3800020491423 | Tablette caramel salé | Knoppers | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3800020491423
5. 4002359021022 | Sås Till Bolognese Original | Dolmio | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4002359021022
6. 4009900390309 | Extra Professional - Strong Mint | Extra, Wrigley | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4009900390309
7. 4011800563516 | Corny Big | Corny | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4011800563516
8. 4014400901191 | Merci | Storck | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4014400901191
9. 4016241051035 | Mild Kvarg Vanilj | Arla | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4016241051035
10. 4100290056308 | Caffé Latte | Starbucks | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4100290056308
11. 4100290056438 | Cappuccino Chilled Coffee | Starbucks | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4100290056438
12. 4740173001775 | Vannamei Räkor | Marwi | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4740173001775
