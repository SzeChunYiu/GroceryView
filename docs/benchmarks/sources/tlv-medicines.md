# TLV_MEDICINES — TLV regulated medicine prices

- Source: TLV (Tandvårds- och läkemedelsförmånsverket), Sweden.
- Endpoint used by connector: `https://www.tlv.se/download/18.467926b615d084471ac33996/1654594873847/prisdatabas.csv`
- Cadence: quarterly, scheduled as `23 4 3 JAN,APR,JUL,OCT *`.
- Registry status after this change: `ingestion_ready`. Promote to `live` only after production fetch persists `benchmark_observation` rows.
- Value label: `regulated_reference`, not retail shelf price.

## Response shape

The connector expects a delimited text/CSV file. It detects `;` vs `,` from the header and reads period/date fields (`period`, `månad`, `datum`, `beslutsdatum`, `gäller från`) plus price fields (`pris`, `AIP`, `AUP`, or `price`). Rows without a parseable period or numeric source value are skipped.

## License and citation

Cite TLV as the Swedish reimbursement/reference-price authority and keep links back to `tlv.se`. Values must be displayed as regulated reference values, not retailer prices.

## Pagination and rate limits

The current file endpoint is a single download; no pagination is expected. Fetch quarterly and avoid retries that could look like scraping bursts. If TLV replaces the file URL, update the endpoint and fixture before enabling production fetches.

## Hard rule

Never fabricate values. If TLV returns no numeric value for a period, emit no row for that period; do not interpolate, carry forward, or estimate.
