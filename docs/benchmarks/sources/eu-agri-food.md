# EU_AGRI_FOOD — EU agri-food upstream prices

- Source: European Commission Agri-food Data Portal.
- Endpoint used by connector: `https://api.tech.ec.europa.eu/agrifood/api/fruitAndVegetable/pricesSupplyChain?memberStateCodes=SE`
- API documentation: `https://agridata.ec.europa.eu/extensions/API_Documentation/fruitandvegetables.html`
- Cadence: weekly, scheduled as `17 5 * * 2`.
- Registry status after this change: `ingestion_ready`. Promote to `live` only after production fetch persists `benchmark_observation` rows.
- Value label: `upstream_agriculture`, not shelf price.

## Response shape

The connector consumes JSON rows from the fruit and vegetables supply-chain prices endpoint. The documented row fields include `memberStateCode`, `beginDate`, `endDate`, `price`, `unit`, `periodType`, `period`, `year`, `variety`, `productStage`, `market`, `isCalculated`, and `isRegulated`. Dates are returned as `dd/MM/yyyy`; the connector stores the begin date as `YYYY-MM-DD`.

## License and citation

Cite the European Commission Agri-food Data Portal and link to the API documentation. The portal describes the API as the official public Agri-food Data API and documents API gateway rate limiting responses.

## Pagination and rate limits

The current fruit and vegetables supply-chain endpoint is a direct GET endpoint under `https://api.tech.ec.europa.eu/agrifood`. The API documentation notes gateway throttling (`429 Too many requests`) and `503` API-limit responses; keep this connector on the weekly cadence and avoid burst retries. No pagination parameter is required for the Swedish filtered request.

## Hard rule

Never fabricate values. If the API returns no numeric `price` for a period, emit no `benchmark_observation` row for that period; do not interpolate, carry forward, or estimate.
