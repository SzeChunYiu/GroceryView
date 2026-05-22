# OpenFoodFacts ingestion evidence

- Source: official OpenFoodFacts world data export
- Source URL: https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
- Retrieved: 2026-05-22T10:35:19.826Z
- Candidate barcode count checked from current Willys/Hemkop/Coop/ICA reklamblad ingested rows: 1113
- ICA reklamblad candidate barcode count: 346
- Real rows fetched: 539 barcode+nutrition rows matched to existing ingested retailer products
- Connector: packages/ingestion/src/connectors/openfoodfacts.ts
- Web wire: apps/web/src/lib/ingested/openfoodfacts.ts

The direct product API returned HTTP 429 during the 2026-05-22 probe. The official OpenFoodFacts export URL under `world.openfoodfacts.org/data` streamed successfully, so this iteration uses that public export. Candidate barcodes came only from committed `origin/main` Willys/Hemkop/Coop/ICA reklamblad ingested rows: Coop `ean` fields, ICA reklamblad `eans` fields, and Axfood EANs embedded in Willys/Hemkop image URLs. No-match and nutrition-empty products were skipped. Every emitted row includes its exact export source marker in `sourceUrl`, a product URL, and the retailer rows it matched by barcode.

## Verification

- Verified: 2026-05-22T10:38:52Z
- Export join path: `fetchOpenFoodFactsExportRetailerEnrichments`
- Unit coverage: `fetchOpenFoodFactsExportRetailerEnrichments` joins only retailer candidate barcodes from the export and skips nutrition-empty rows.
- Artifact audit: `rowCount` 539 equals 539 emitted barcode rows; all 539 barcodes are unique; `candidateBarcodeCount` 1113 equals the 1113 unique usable committed Willys/Hemkop/Coop/ICA reklamblad candidate barcodes; `icaReklambladCandidateBarcodeCount` 346 equals the 346 unique usable ICA reklamblad EANs; emitted match chains are coop, hemkop, ica, willys; every emitted barcode appears in those committed candidates; zero emitted rows have empty nutrition; zero emitted rows use a source outside `https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=...`.

## Sample Retrieved Rows

1. 2340398000007 | Ost Gräddis | ARLa | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=2340398000007
2. 3254474019274 | Maiskorn i saltlake | Green Giant | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3254474019274
3. 3415581520927 | Fruit Collection | Häagen-Dazs | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3415581520927
4. 3523230062633 | Chèvre | Soignon | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3523230062633
5. 3800020491423 | Tablette caramel salé | Knoppers | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3800020491423
6. 4000177026700 | Caprisun Jungle Drink | Capri-Sun | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4000177026700
7. 4000177158227 | Capri-Sun Orange | Capri-Sun | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4000177158227
8. 4002359021022 | Sås Till Bolognese Original | Dolmio | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4002359021022
9. 4009900390309 | Extra Professional - Strong Mint | Extra, Wrigley | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4009900390309
10. 4011800563516 | Corny Big | Corny | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4011800563516
11. 4014400901191 | Merci | Storck | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4014400901191
12. 4016241051035 | Mild Kvarg Vanilj | Arla | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4016241051035
