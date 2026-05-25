# Preem Sweden Connector

Last verified: 2026-05-25.

## Source

- Operator site: `https://www.preem.se`
- Consumer fuel-pricing explainer: `https://www.preem.se/pa-stationen/drivmedel/drivmedelspriser/`
- Business list prices: `https://www.preem.se/foretag/listpriser/`
- Member-card discounts: `https://www.preem.se/preem-medlem/preem-mastercard/`
- Station pages: `https://www.preem.se/stationer/`
- Robots posture: `https://www.preem.se/robots.txt` returned `Allow: /` during the 2026-05-25 verification.

The connector should treat Preem as a fuel and station-convenience operator, not
as a grocery assortment source. Public consumer fuel pages do not expose a
chain-wide pump-price table. Preem states that current petrol and diesel prices
are found on the price pole at the nearest Preem station, while the business
list-price page is explicitly for company-card, truck-card, and bulk customers.

## Extracted fields

For business list-price rows from `/foretag/listpriser/`:

| Field | Source detail |
|---|---|
| `connectorId` | Stable connector id, `preem-se`. |
| `chainId` | Stable chain/operator id, `preem-se`. |
| `domain` | `fuel`. |
| `sourceUrl` | Exact Preem page URL used for the row. |
| `sourceType` | `operator_online_page`. |
| `customerSegment` | `business` for Företagskort, Transportkort, Truckkort, and Bulk list prices. |
| `priceKind` | Business list price, not consumer pump price. |
| `productName` | Fuel or energy product label as published by Preem. |
| `fuelGrade` | Normalized grade when the source label maps cleanly, for example `95`, `98`, `diesel`, `hvo100`, or `e85`. |
| `pricePerUnit` | Numeric SEK value parsed from the published list price. |
| `unit` | Usually litre for liquid fuel; EV charging rows should keep their published unit, such as kWh. |
| `validFrom` | Effective date when the page states one. |
| `observedAt` | Connector retrieval timestamp. |

For consumer and station-discovery rows:

| Field | Source detail |
|---|---|
| `stationUrl` | Station page under `/stationer/` when a row is tied to a specific station. |
| `stationName` | Station display name from the station page. |
| `address` | Published station address, when present. |
| `services` | Station amenities or formats, when present. |
| `priceScope` | `station_local` for any verified consumer pump-price row. |
| `channel` | `store` for station-local pump rows. |

For Preem Mastercard discount rows:

| Field | Source detail |
|---|---|
| `membershipProgram` | `Preem Mastercard`. |
| `isMemberPrice` | `true` for discount rows. |
| `discountOrePerLiter` | 25 for staffed stations and 10 for automated stations as verified on 2026-05-25. |
| `bonusRate` | 0.5% for everyday purchases when recording the card benefit, not a product price. |

## Known quirks

- Consumer pump prices are local. Do not convert the consumer fuel-pricing page
  into a chain-wide price observation; it only says to check the nearest
  station's price pole.
- Business list prices are separate from consumer pump prices. Rows from
  `/foretag/listpriser/` must be tagged as business/customer-card list prices.
- The Preem Mastercard discount page is
  `/preem-medlem/preem-mastercard/`. The older
  `/privat/kort-och-formaner/preem-mastercard/rabatter/` URL returned 404 on
  2026-05-25.
- Station pages appear in the sitemap with frequently updated `lastmod`
  timestamps. They are useful for store metadata, but they are not proof that a
  public station page exposes live pump prices.
- The public station food and offers pages describe convenience-store products
  and campaigns, but no durable grocery SKU price feed was verified from
  `preem.se`.

## Edge cases

- Parse Swedish decimal commas and unit labels before storing numeric prices.
- Preserve published units for gas, electricity, and bulk products; do not force
  everything into litre-based fuel grades.
- If a page returns a login wall, captcha, 401/403/407/429, or a materially
  different structure, fail closed and record a blocker instead of emitting
  synthetic prices.
- Avoid mixing card discounts with pump-price observations. Discounts can be
  represented as benefits or adjustment rows, but they are not standalone pump
  prices.
- If station-local consumer prices are added later, require station identity and
  observation time for every price row.

## Related docs

- `docs/chain-studies/preem-se.md`
- `docs/data-sources.md#2f-fuel-prices`
