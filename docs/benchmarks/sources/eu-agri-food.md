# EU_AGRI_FOOD — EU agri-food upstream prices

- Source: European Commission Agri-food Data Portal, fruit and vegetables supply-chain prices.
- API endpoint used: `https://api.tech.ec.europa.eu/agrifood/fruitandvegetables/prices`.
- Response shape: JSON array or envelope (`data`, `items`, `results`, `records`, or `content`) containing country/member-state fields, product stage, period/begin date, value, unit, and optional ECOICOP/product code.
- License/citation: cite the European Commission Agri-food Data Portal and keep source URL with every ingestion run.
- Rate limits: API gateway rate limiting is documented by the Agri-food Data API guide; connector fails closed on 401/403/407/429.
- Pagination: endpoint family may paginate behind envelope fields; this connector only emits rows present in the fetched response.
- Guardrail: rows are labeled `upstream_agriculture`, not shelf price. Retail/consumer/shelf stages are dropped. Missing source values emit no row; there is no interpolation, carry-forward, or estimate.
