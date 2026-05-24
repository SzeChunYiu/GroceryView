# EUROSTAT_HICP benchmark source

Status: ingestion_ready. The connector is `packages/ingestion/src/connectors/benchmarks/eurostat-hicp.ts` and emits `benchmark_observation` rows for SE, NO, and IS.

## API endpoint used

Eurostat SDMX 2.1 dissemination API, JSON-stat response:

`https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/prc_hicp_midx/M.I15.{ecoicop}.{country}?format=JSON&compressed=false`

The connector requests monthly (`M`) index (`I15`, index 2015=100) series for:

- `CP01` food and non-alcoholic beverages → grocery.
- `CP06` health → pharmacy.
- `CP0722` motor fuels → fuel.

## Response shape

The API returns JSON-stat 2.0 with dimensions `freq`, `unit`, `coicop`, `geo`, and `time`. Observation values are keyed by zero-based offsets under `value`; missing periods may be absent or null. The connector emits nothing for missing/null values and never interpolates, carries forward, or estimates.

## License and citation

Source is Eurostat, dataset `prc_hicp_midx` (HICP monthly data index). Cite as Eurostat HICP monthly data via the dissemination API. Eurostat API documentation states the dissemination APIs provide free programmatic access to statistical data and metadata.

## Pagination and rate limits

The connector requests one small country/category series per URL and does not need pagination. Keep the cadence monthly; Eurostat datasets are updated on Eurostat's publication schedule, and repeated intra-day polling is unnecessary.
