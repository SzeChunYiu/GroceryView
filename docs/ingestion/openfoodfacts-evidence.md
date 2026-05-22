# OpenFoodFacts ingestion evidence

- Source: official OpenFoodFacts world data export
- Source URL: https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
- Retrieved: 2026-05-22T11:39:52.564Z
- Candidate barcode count checked from current Willys/Hemkop/Coop/ICA reklamblad ingested rows: 3532
- ICA reklamblad candidate barcode count checked: 990 unique barcodes
- Export rows scanned: 4528597
- Candidate barcodes present in export: 2055
- Matched rows without usable nutrition/name skipped: 348
- Real rows fetched: 1707 barcode+nutrition rows matched to existing ingested retailer products
- Connector: packages/ingestion/src/connectors/openfoodfacts.ts
- Web wire: apps/web/src/lib/ingested/openfoodfacts.ts

The official OpenFoodFacts export URL under `world.openfoodfacts.org/data` streamed successfully, so this iteration uses that public export. Candidate barcodes came only from current Willys/Hemkop/Coop/ICA reklamblad ingested rows: Coop `ean` fields, ICA reklamblad `eans`, and Axfood EANs embedded in Willys/Hemkop image URLs. No-match and nutrition-empty products were skipped. Every emitted row includes its exact export source marker in `sourceUrl`, a product URL, and the retailer rows it matched by barcode.

## Verification

- Verified: 2026-05-22T11:42:36Z
- Export join path: `fetchOpenFoodFactsExportRetailerEnrichments`
- Unit coverage: `fetchOpenFoodFactsExportRetailerEnrichments` joins only retailer candidate barcodes from the export and skips nutrition-empty rows.
- Artifact audit: `rowCount` 1707 equals 1707 emitted barcode rows; all 1707 barcodes are unique; `candidateBarcodeCount` 3532 equals the 3532 unique usable current Willys/Hemkop/Coop/ICA reklamblad candidate barcodes; every emitted barcode appears in those current candidates; zero emitted rows have empty nutrition; zero emitted rows use a source outside `https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=...`.

## Sample Retrieved Rows

1. 0690225301329 | Sella Basmati Rice | India Gate | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=0690225301329
2. 2340398000007 | Ost Gräddis | ARLa | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=2340398000007
3. 3036810100576 | Moutarde de Dijon | Grey Poupon | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3036810100576
4. 3036810201280 | Dijon Originale Senf | Maille | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3036810201280
5. 3176582078038 | le rustique raclette | Le Rustique | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3176582078038
6. 3228024210138 | Burger cheese with cheddar | PRÉSIDENT | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3228024210138
7. 3254474019274 | Maiskorn i saltlake | Green Giant | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3254474019274
8. 3392590205420 | Pizzakit Surdeg | Pop Bakery | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3392590205420
9. 3392590205987 | Napoli Pizza Deg | PPP Bakery | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3392590205987
10. 3392590601536 | Pizzakit Orginal | Pop! | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3392590601536
11. 3415581520927 | Fruit Collection | Häagen-Dazs | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3415581520927
12. 3523230061001 | Mozzarella | Eurial | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3523230061001
