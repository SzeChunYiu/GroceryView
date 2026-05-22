# City Gross Ingestion Evidence

- Retrieved at: `2026-05-22T15:31:43.626Z`
- Store source URL: `https://www.citygross.se/api/v1/PageData/stores`
- Product source URL pattern: `https://www.citygross.se/api/v1/Loop54/products?Q=kaffe&skip={0|24}&take=24&siteId={siteId}`
- Fetch method: `curl -A "GroceryView/0.1"` inspection confirmed `200` JSON from the store catalog and Loop54 product endpoint before regeneration.
- Scope: 40 public City Gross stores, 2 pages per store, 24 product rows per page.
- Generated row count: 1,920 real product rows in `apps/web/src/lib/ingested/citygross.ts`.
- Previous row count on main: 960.
- Delta: +960 rows.

The generated `cityGrossSource.sourceUrls` field cites every concrete product API URL used for the 80 product fetches. Each product row also carries its exact `sourceUrl` and the retrieval timestamp above.
