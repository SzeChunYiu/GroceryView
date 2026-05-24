# SCB CPI benchmark source

- Source id: `SCB_CPI`
- Status: `ingestion_ready` until the first scheduled production run persists rows, then `live`
- Country: `SE`
- Frequency: monthly
- Endpoint used: `https://api.scb.se/OV0104/v1/doris/sv/ssd/START/PR/PR0101/PR0101A/KPI2020COICOPM`

## Request shape

The connector POSTs JSON-stat2 requests for `ContentsCode=0000080H` (index 2020=100), `Tid=top 1` by default, and these COICOP groups:

- `00` overall CPI
- `01` food and non-alcoholic beverages
- `06.1` pharmaceutical/medical products
- `07.2.2` fuels and lubricants

## Response shape

SCB returns JSON-stat2 with dimensions `VaruTjanstegrupp`, `ContentsCode`, and `Tid`, plus a flat `value` array. The connector maps finite numeric values only into `benchmark_observation` rows: `source_id`, `country`, `vertical`, `ecoicop_code`, `period`, `value`, `unit`, and `observed_at`.

## License and citation

Data is fetched from Statistics Sweden (SCB), source label `SCB`, using the public SCB API. Cite SCB as the source for any rendered CPI benchmark values.

## Gotchas

Do not interpolate, carry forward, or estimate missing values. If SCB returns `null`/missing for a period or COICOP code, the connector emits no row for that period/code.
