# Circle K Sweden connector notes

Last verified from checked-in connector code and fixture tests: **2026-05-25**. No live fetch was run for this documentation-only note.

Circle K Sweden is covered by GroceryView's branded Swedish fuel-station connector rather than a Circle K pump-price feed. The connector posts an OpenStreetMap Overpass query for Swedish `amenity=fuel` rows whose `brand`, `name`, or `operator` matches one of the supported fuel chains, including `Circle K`.

## Data source

| Surface | Source URL | Connector entry point | Notes |
| --- | --- | --- | --- |
| Swedish branded fuel stations | `https://overpass-api.de/api/interpreter` | `fetchBrandedSwedishFuelStations()` in `packages/ingestion/src/connectors/fuel-stations.ts` | Posts `SWEDEN_BRANDED_FUEL_STATIONS_OVERPASS_QUERY`, scoped to Sweden (`ISO3166-1=SE`) and `amenity=fuel` rows. |
| Circle K station rows | OpenStreetMap `node`, `way`, and `relation` elements | `parseBrandedSwedishFuelStations()` / `normalizeBrandedSwedishFuelStation()` | Rows are accepted only when coordinates, `amenity=fuel`, and a normalized supported chain match are present. |
| Checked-in web artifact | `apps/web/src/lib/ingested/fuel-stations.ts` | Fuel route display in `apps/web/src/app/fuel/page.tsx` | Displays station coverage and map positions only; it does not create Circle K pump-price claims. |

## Extracted fields

Accepted Circle K rows normalize into `BrandedSwedishFuelStation` with:

- `osmType` and `osmId` from the OSM element identity.
- `name`, `chain`, `brand`, and `operator` from OSM tags; `chain` normalizes to `Circle K` when `brand`, `name`, or `operator` contains that chain name.
- `amenity` fixed to `fuel` after the source tag is validated.
- `latitude` and `longitude` from node coordinates or way/relation center coordinates.
- Address and contact fields: `street`, `houseNumber`, `postcode`, `city`, `openingHours`, `website`, and `phone`.
- `sourceUrl`, always the Overpass interpreter endpoint, and `retrievedAt`, supplied by the fetch caller.

## Known quirks and edge cases

- This connector is station-location evidence only. It does **not** fetch Circle K product prices, pump prices, promotions, loyalty prices, or store-stock data.
- OSM rows are community-maintained; missing website, phone, opening-hours, or address tags are preserved as empty strings rather than inferred.
- Brand matching checks `brand`, `name`, and `operator` tags case-insensitively, so stale or inconsistently tagged OSM elements can affect chain attribution.
- Elements without coordinates, without `amenity=fuel`, or without a supported chain match are dropped.
- Way and relation rows use Overpass `center` coordinates, which are suitable for map placement but not a forecourt boundary.
- The row `sourceUrl` points to the Overpass endpoint, not to a Circle K-owned page. Per-station `website` is retained separately when OSM provides it.
- Fuel grade availability and operator fuel-price observations are handled by other fuel-domain paths; this connector must not be used to imply a current price at any Circle K station.

## Evidence and generated artifacts

- Connector implementation: `packages/ingestion/src/connectors/fuel-stations.ts`.
- Fixture coverage: `packages/ingestion/src/__tests__/ingestion.test.ts` verifies Circle K query matching and row normalization.
- Web artifact: `apps/web/src/lib/ingested/fuel-stations.ts` contains the checked-in Overpass extract consumed by the fuel route.
- Route guardrails: `apps/web/src/lib/verified-data.ts` documents `fuelStationSourceCoverage` with `priceObservationCount: 0` for OSM station rows.

## Last verification

Checked-in Circle K station connector code, fixture assertions, and fuel-route guardrails were inspected on **2026-05-25**. No live Overpass or Circle K request was run for this documentation-only update.
