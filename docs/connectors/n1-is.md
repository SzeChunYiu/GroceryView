# N1 Iceland connector notes (`n1-is`)

Last verified: 2026-05-24

## Source surfaces

- Primary site: <https://www.n1.is/en/>
- Station finder: <https://www.n1.is/en/locations/>
- Fuel price page: <https://www.n1.is/thjonusta/eldsneyti/daeluverd/>
- Traveller service guide: <https://www.n1.is/en/about-n1/your-guide-to-n1-services/>

N1 is a fuel, service-station, charging, convenience, and travel-supplies chain rather than a full grocery supermarket. Treat it as an Iceland convenience/fuel connector for station coverage and travel-basket evidence. Do not rank it as a primary weekly-grocery chain unless the source surface starts exposing a stable product catalogue with grocery SKUs and prices.

## Data source the connector should pull from

1. **Station finder** (`/en/locations/`)
   - Canonical source for locations, station type, region filters, fuel availability, staffed/self-service status, supply-store facets, Nesti/food availability, and amenities.
   - The UI is filter-heavy; preserve raw station payloads or DOM snapshots whenever implementing the connector so source-backed service facets can be audited.
2. **Fuel price page** (`/thjonusta/eldsneyti/daeluverd/`)
   - Canonical source for current pump prices when the connector is enabled for fuel observations.
   - Fuel observations must be clearly typed as fuel prices, not grocery shelf prices.
3. **Service/guide pages** (`/en/`, `/en/about-n1/your-guide-to-n1-services/`)
   - Supporting evidence for chain positioning: N1 exposes prepaid cards, staffed service centers, food/refreshment offers, supplies, and fuel/payment instructions.
   - Use these pages for documentation and chain metadata only; avoid turning marketing copy into product rows.

## Fields to extract

### Chain metadata

- `chainId`: `n1-is`
- `country`: `IS`
- `name`: `N1`
- `sourceUrl`: page URL used for the row
- `retrievedAt`: UTC timestamp for the fetch
- `sourceType`: `station_finder`, `fuel_price`, or `chain_metadata`

### Store/station rows

- `stationId` or stable slug from the station source when available
- `name`
- `address`
- `region`
- `latitude` / `longitude` when exposed by the station finder
- `stationType`: staffed service station, self-service station, or both
- `isOpen24Hours` when explicitly exposed
- `services`: normalized list such as `wc`, `wifi`, `air`, `vacuum`, `car_wash`, `tire_service`, `oil_change`, `repairs`, `ev_charging`, `travel_wc_disposal`, `nesti`, `supply_store`
- `fuelTypes`: `95_octane`, `98_octane`, `diesel`, `colored_diesel`, `methane`, `adblue`, and any EV charging facet when exposed
- `rawServices`: original labels from the N1 source for auditability

### Fuel observations

- `stationId` or national/default price scope if the page does not expose station-level variance
- `fuelType`
- `priceIskPerLiter`
- `priceText`
- `discountProgram` only when the page explicitly marks a price as a discount/member/lowest-price offer
- `validFrom` / `retrievedAt`
- `sourceUrl`

### Convenience/food metadata

Only emit product-level grocery rows if N1 exposes stable product names, package sizes, and prices. Until then, keep food/supplies as station service metadata:

- `hasFoodOrRefreshments`
- `hasCoffeeSnacks`
- `hasNesti`
- `hasSupplyStore`
- `knownPreparedFood`: free-text metadata only when source-backed, e.g. meat soup from the N1 home page; do not fabricate SKU rows.

## Known quirks

- N1 has many station/service facets that are useful for traveller coverage but are not grocery product prices.
- The English pages mix localized navigation labels with Icelandic service names; keep both raw labels and normalized values.
- Some N1 locations are self-service fuel pumps only. They should not be counted as grocery/convenience shops unless the source marks a staffed service center, Nesti, food, or supply-store facet.
- Fuel is sold by litre and commonly uses `95 Octane` and `Diesel`; the traveller guide notes different pump-handle colors. This is useful for help text, not price normalization.
- Prepaid cards can be used for fuel and inside staffed service centers, but card usability is not proof of product availability.
- N1's site may expose live content through client-side filters. Connector implementation should snapshot the raw response/DOM and fail closed if station attributes cannot be parsed confidently.

## Edge cases and fail-closed behavior

- If coordinates or station ids are missing, still keep a chain-level evidence row but do not generate duplicate store ids from unstable display text without a deterministic slug strategy.
- If a station has fuel but no food/supply-store facet, include it in fuel/station coverage only.
- If the fuel price page changes layout or omits a fuel type, omit that fuel observation rather than carrying forward stale prices.
- If a location has both staffed and self-service facets, keep both flags so the UI can distinguish 24/7 fuel access from staffed shop access.
- If N1 publishes promotions without package size or price, record them as marketing metadata only; do not generate GroceryView comparable product rows.

## Fixture suggestions

When a connector is implemented, include fixtures covering:

1. A staffed service station with Nesti/food and supply-store facets.
2. A self-service-only station with fuel types but no convenience-store evidence.
3. A station with EV charging or additional car-service facets.
4. A fuel price page sample with at least 95 octane and diesel.
5. A layout-change fixture where one optional field is absent and the connector omits only the affected normalized field.

## Chain-study link

This connector is listed in the Iceland chain study: [`docs/research/iceland-chain-study.md`](../research/iceland-chain-study.md).
