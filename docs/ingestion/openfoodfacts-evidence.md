# OpenFoodFacts ingestion evidence

- Source: official OpenFoodFacts world data export
- Source URL: https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
- Retrieved: 2026-05-22T11:18:28.578Z
- Candidate barcode count checked from current Willys/Hemkop/Coop/ICA reklamblad ingested rows: 2968
- ICA reklamblad candidate barcode count checked: 362 unique barcodes
- Export rows scanned: 4528597
- Candidate barcodes present in export: 1897
- Matched rows without usable nutrition/name skipped: 310
- Real rows fetched: 1587 barcode+nutrition rows matched to existing ingested retailer products
- Connector: packages/ingestion/src/connectors/openfoodfacts.ts
- Web wire: apps/web/src/lib/ingested/openfoodfacts.ts

The direct product API returned HTTP 429 during the 2026-05-22 probe. The official OpenFoodFacts export URL under `world.openfoodfacts.org/data` streamed successfully, so this iteration uses that public export. Candidate barcodes came only from current Willys/Hemkop/Coop/ICA reklamblad ingested rows: Coop `ean` fields, ICA reklamblad `eans`, and Axfood EANs embedded in Willys/Hemkop image URLs. No-match and nutrition-empty products were skipped. Every emitted row includes its exact export source marker in `sourceUrl`, a product URL, and the retailer rows it matched by barcode.

## Verification

- Verified: 2026-05-22T11:21:04Z
- Export join path: `fetchOpenFoodFactsExportRetailerEnrichments`
- Unit coverage: `fetchOpenFoodFactsExportRetailerEnrichments` joins only retailer candidate barcodes from the export and skips nutrition-empty rows.
- Artifact audit: `rowCount` 1587 equals 1587 emitted barcode rows; all 1587 barcodes are unique; `candidateBarcodeCount` 2968 equals the 2968 unique usable current Willys/Hemkop/Coop/ICA reklamblad candidate barcodes; every emitted barcode appears in those current candidates; zero emitted rows have empty nutrition; zero emitted rows use a source outside `https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=...`.

## Sample Retrieved Rows

1. 0690225301329 | Sella Basmati Rice | India Gate | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=0690225301329
2. 2340398000007 | Ost Gräddis | ARLa | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=2340398000007
3. 3036810100576 | Moutarde de Dijon | Grey Poupon | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3036810100576
4. 3036810201280 | Dijon Originale Senf | Maille | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3036810201280
5. 3176582078038 | le rustique raclette | Le Rustique | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3176582078038
6. 3228024210138 | Burger cheese with cheddar | PRÉSIDENT | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3228024210138
7. 3254474019274 | Maiskorn i saltlake | Green Giant | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3254474019274
8. 3415581520927 | Fruit Collection | Häagen-Dazs | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3415581520927
9. 3523230061001 | Mozzarella | Eurial | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3523230061001
10. 3523230062633 | Chèvre | Soignon | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3523230062633
11. 3523230064903 | Mozzarella | Maestrella | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3523230064903
12. 3800020491423 | Tablette caramel salé | Knoppers | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3800020491423
