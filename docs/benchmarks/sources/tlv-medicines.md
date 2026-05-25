# TLV_MEDICINES — TLV regulated medicine prices

## What it measures

TLV publishes Swedish price and reimbursement references for medicines and medical products in the high-cost threshold system. This is a regulated reference layer for AIP/AUP-style reimbursement data, not GroceryView retail shelf evidence.

## What it does not measure

TLV does not measure arbitrary over-the-counter pharmacy shelf prices, store-specific promotions, shopper basket totals, or GroceryView retail observations. UI labels must say `regulated_reference`, not normal retail price.

- Source: TLV (Tandvårds- och läkemedelsförmånsverket), Sweden.
- Endpoint used by connector: `https://www.tlv.se/download/18.467926b615d084471ac33996/1654594873847/prisdatabas.csv`
- Cadence: quarterly, scheduled as `23 4 3 JAN,APR,JUL,OCT *`.
- Registry status in the ingestion connector: `ingestion_ready`. Promote to `live` only after production fetch persists `benchmark_observation` rows.
- Value label: `regulated_reference`, not retail shelf price.

## Sample API call

```sh
curl 'https://www.tlv.se/download/18.467926b615d084471ac33996/1654594873847/prisdatabas.csv'
```

## Response shape

The connector expects a delimited text/CSV file. It detects `;` vs `,` from the header and reads period/date fields (`period`, `månad`, `datum`, `beslutsdatum`, `gäller från`) plus price fields (`pris`, `AIP`, `AUP`, or `price`). Rows without a parseable period or numeric source value are skipped.

## License / terms

Cite TLV as the Swedish reimbursement/reference-price authority and keep links back to `tlv.se`. Values must be displayed as regulated reference values, not retailer prices.

## Refresh cadence

The current file endpoint is a single download; no pagination is expected. Fetch quarterly and avoid retries that could look like scraping bursts. If TLV replaces the file URL, update the endpoint and fixture before enabling production fetches.

## Hard rule

Never fabricate values. If TLV returns no numeric value for a period, emit no row for that period; do not interpolate, carry forward, or estimate.
