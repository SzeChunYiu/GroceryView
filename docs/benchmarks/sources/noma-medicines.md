# NOMA_MEDICINES — NoMA Norwegian max prices

- **Agency:** Norwegian Medical Products Agency / Direktoratet for medisinske produkter (NoMA/DMP)
- **Country:** NO
- **Vertical:** pharmacy
- **Cadence:** quarterly benchmark ingestion check
- **Status:** live
- **Endpoint used:** `https://www.dmp.no/contentassets/fed1be54a81f4ec99a2329ca0fd0964c/package-prices-2026-05-04.xlsx`
- **Landing page:** `https://www.dmp.no/en/public-funding-and-pricing/pricing-of-medicines/maximum-price`

## Source and citation

DMP publishes the “Price- and reimbursement list” from the maximum-price page. The page states that the list contains maximum PPP excluding VAT and maximum PRP including VAT, and that actual pharmacy prices can be lower. GroceryView labels every emitted value as `regulated_reference`, not a retail shelf price.

## Response shape

The endpoint is an XLSX workbook with a single worksheet. The first rows carry the title (`Package prices`) and publication date (`2026-05-04`). The header row contains fields including:

- `Article number`
- `Product name`
- `PPP`
- `PRP`
- `Stepped price`
- `Reimbursed price`
- `ATC-code`

The connector emits one `benchmark_observation` row per non-empty numeric price cell. It never interpolates, carries forward, or estimates missing values. Source-specific `ecoicop_code` values are encoded as `NOMA:{ATC-code}:{Article number}:{price kind}` so the narrow benchmark table can retain package-level provenance.

## License / reuse

Use is limited to cited public-sector benchmark ingestion. Keep DMP/NoMA citation and the landing page URL with any downstream export. The source is a regulated reference list and must not be presented as observed retail pricing.

## Pagination and rate limits

No pagination was observed for the XLSX file. Fetch quarterly or on manual refresh; do not poll the file as a high-frequency retail-price feed.
