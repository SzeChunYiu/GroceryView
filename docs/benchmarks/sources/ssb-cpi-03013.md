# SSB_CPI_03013 — Norway CPI by consumption group

- Source: Statistics Norway (Statistisk sentralbyrå, SSB), StatBank table 03013.
- Endpoint used by connector: `https://data.ssb.no/api/v0/no/table/03013`
- Method: `POST` with a JSON-stat2 response request.
- Cadence: monthly, scheduled as `17 5 12 * *` after the usual CPI publication window.
- Registry status after this change: `ingestion_ready`. Promote to `live` only after the production fetch persists `benchmark_observation` rows.
- Value label: CPI index points (`KpiIndMnd`, base period 2015=100), not retailer prices.

## Request body

The connector requests `Konsumgrp` values `01`, `06.1.1`, `07.2.2.1`, `07.2.2.2`, and `07.2.2.3`, `ContentsCode=KpiIndMnd`, and the latest bounded set of `Tid` months using the StatBank `top` filter.

## Response shape

SSB returns JSON-stat2 with dimensions ordered as `Konsumgrp`, `ContentsCode`, and `Tid`. The parser walks the published group/time indexes, converts SSB month codes like `2025M12` to `2025-12`, maps food to `grocery`, medicines to `pharmacy`, petrol/diesel to `fuel`, and emits one `benchmark_observation` row per numeric source value.

Rows with missing, null, non-numeric, or unparsable period values are skipped. The connector never interpolates, carries forward, or estimates missing CPI periods.

## License and citation

Cite Statistics Norway / Statistisk sentralbyrå and table 03013 when presenting values. Keep the SSB table identifier and retrieval timestamp with downstream benchmark displays.

## Pagination and rate limits

The API does not paginate this bounded JSON-stat query. Keep the monthly cadence and bounded `Tid` top filter so ingestion does not request the full historical table on every run.
