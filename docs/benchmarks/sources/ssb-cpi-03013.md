# SSB CPI 03013

- Source id: `SSB_CPI_03013`
- Endpoint used: `https://data.ssb.no/api/v0/no/table/03013`
- Method: `POST`
- Response format requested: `JSON-stat2`
- Frequency: monthly
- Country: `NO`

The connector requests selected `Konsumgrp` ECOICOP consumption groups, `ContentsCode=KpiIndMnd`, and recent `Tid` periods. The response shape is JSON-stat2 with `id`, `size`, `dimension.{Konsumgrp,Tid}.category.index`, and a flat `value` array. Null values are skipped; the connector never interpolates, carries forward, or estimates missing periods.

Mapped groups in the first ingestion pass:

- `01` → `food`
- `06.1` → `pharmacy`
- `07.2.2` → `fuel`

Rows emitted for `benchmark_observation`: `source_id`, `country`, `vertical`, `ecoicop_code`, `period`, `value`, `unit`, `observed_at`.

Citation: Statistics Norway (SSB), table 03013, CPI by consumption group. SSB API terms and metadata are provided by the table endpoint and the SSB API documentation. No pagination is required for the requested top/month window; callers should retry politely on HTTP 429/5xx.
