# OpenFoodFacts ingestion evidence

- Source: official OpenFoodFacts world data export
- Source URL: https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
- Retrieved: 2026-05-22T23:15:13.503Z
- Candidate barcode count checked from current City Gross/Willys/Hemkop/Coop/ICA ingested rows: 5148
- Candidate source surfaces: citygross/products 48 unique barcodes from 1920/1920 rows; willys/products 353 unique barcodes from 353/354 rows; willys/weeklyDiscounts 203 unique barcodes from 36026/36570 rows; hemkop/products 2099 unique barcodes from 2099/2100 rows; hemkop/weeklyDiscounts 247 unique barcodes from 17650/17650 rows; coop/products 2205 unique barcodes from 2205/2205 rows; coop/weeklyDiscounts 38 unique barcodes from 2762/2762 rows; ica/reklambladOffers 1153 unique barcodes from 638/638 rows; ica/storePromotions 5 unique barcodes from 1456/92969 rows
- Export rows scanned: 4528597
- Candidate barcodes present in export: 3238
- Candidate barcodes not present in export and skipped: 1910
- Matched rows without usable nutrition/name skipped: 594
- Real rows fetched: 2644 barcode+nutrition rows matched to existing ingested retailer products
- Retailer rows linked by those real barcodes: 34601
- Connector: packages/ingestion/src/connectors/openfoodfacts.ts
- Generator: scripts/ingestion/generate-openfoodfacts-enrichment.mjs
- Web wire: apps/web/src/lib/ingested/openfoodfacts.ts

The official OpenFoodFacts export URL under `world.openfoodfacts.org/data` streamed successfully, so this iteration uses that public export. Candidate barcodes came only from current ingested rows with a real barcode-bearing field or URL: City Gross `gtin` fields, Coop `ean` fields, ICA reklamblad `eans`, and barcode-like public image URL filenames from Willys, Hemkop, and ICA store promotions. Lidl, Mathem, Matspar, and Matpriskollen wired rows were inspected but skipped because they do not expose barcode fields in the ingested artifacts. No-match and nutrition-empty products were skipped. Every emitted row includes its exact export source marker in `sourceUrl`, a product URL, and the retailer rows it matched by barcode.

## Verification

- Verified: 2026-05-22T23:15:13.503Z
- Export join path: `fetchOpenFoodFactsExportRetailerEnrichments` plus checked-in generator candidate extraction
- Unit coverage: `fetchOpenFoodFactsExportRetailerEnrichments` joins only retailer candidate barcodes from the export and skips nutrition-empty rows; barcode image extraction covers Axfood and generic digit filename segments.
- Artifact audit: `rowCount` 2644 equals 2644 emitted barcode rows; `retailerMatchCount` 34601 equals emitted retailer match links; all emitted barcodes are unique; `candidateBarcodeCount` 5148 equals the unique usable current candidate barcodes; every emitted barcode appears in those current candidates; zero emitted rows have empty nutrition; zero emitted rows use a source outside `https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=...`.

## Sample Retrieved Rows

1. 0690225301329 | Sella Basmati Rice | India Gate | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=0690225301329
2. 2340398000007 | Ost Gräddis | ARLa | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=2340398000007
3. 3036810100576 | Moutarde de Dijon | Grey Poupon | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3036810100576
4. 3036810201280 | Dijon Originale Senf | Maille | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3036810201280
5. 3046920043489 | CRÈME BRÛLÉE Milk Chocolate | Lindt | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3046920043489
6. 3176582078038 | le rustique raclette | Le Rustique | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3176582078038
7. 3228024210138 | Burger cheese with cheddar | PRÉSIDENT | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3228024210138
8. 3254474019274 | Maiskorn i saltlake | Green Giant | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3254474019274
9. 3329770077959 | Original Blueberry | Yoplait | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3329770077959
10. 3392590205420 | Pizzakit Surdeg | Pop Bakery | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3392590205420
11. 3392590205987 | Napoli Pizza Deg | PPP Bakery | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3392590205987
12. 3392590601536 | Pizzakit Orginal | Pop! | https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3392590601536
