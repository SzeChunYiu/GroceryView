# Connector docs: circle-k-se

Last verified: 2026-05-24

## Data source

- Current repository connector coverage for Circle K Sweden comes from the branded fuel-station Overpass query in `packages/ingestion/src/connectors/fuel-stations.ts`.
- The source searches OpenStreetMap fuel POIs and treats `Circle K` as a branded Swedish fuel-station chain for station coverage and map surfaces.

## Extracted fields

- `chainId`: normalized Circle K chain id for branded fuel coverage.
- `name`: station/POI name from OSM tags.
- `latitude` / `longitude`: station coordinates.
- `brand` / `operator`: OSM brand/operator tags when present.
- `source`: Overpass/OpenStreetMap provenance.

## Known quirks

- OSM station rows are coverage evidence only; they do not contain live pump prices.
- Brand tagging can vary between `brand`, `operator`, and station name, so matching must preserve raw OSM tags for review.
- Fuel stations may include convenience-store amenities, but the connector must not infer grocery assortment from a fuel POI alone.

## Edge cases

- Duplicate stations can appear when OSM has multiple nearby fuel POIs for one forecourt; downstream dedupe should use coordinates plus normalized name.
- Missing brand/operator tags should not be auto-filled unless the station name contains a reviewed Circle K match.
- Closed or renamed stations depend on OSM freshness and should be treated as stale until the next Overpass refresh.

## Chain-study link

- Chain study reference: `docs/chain-studies/circle-k-se.md` when the Circle K study file is present.
