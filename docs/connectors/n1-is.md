# N1 IS connector notes

Last verified from checked-in connector fixtures: **2026-05-25**. Connector source inspected: **2026-05-25**.

## Source pulled

- Chain id: `n1-is`.
- Source URL: `https://www.n1.is/verd/eldsneytisverd/`.
- Page shape: public N1 Iceland HTML fuel-price table.
- Runtime entry points: `fetchN1IsFuelPrices()` and `parseN1IsFuelPricePage()` in `packages/ingestion/src/connectors/n1-is.ts`.
- Source posture: read-only public operator price page. The connector sends a GroceryView User-Agent and fails closed on blocked/login/captcha pages.

## Extracted fields

Each accepted row is normalized into `N1IsFuelPriceObservation`:

| Field | Source / rule |
| --- | --- |
| `domain` | Constant `fuel`. |
| `productId` | `fuel-95-e10` for Bensín/95 columns; `fuel-diesel` for Dísel/Diesel columns. Colored diesel columns are ignored. |
| `gradeLabel` | Canonical N1 fuel label (`N1 Bensín` or `N1 Dísel`). |
| `pricePerLitre` | Icelandic króna per litre parsed from table cells such as `311,2 kr./l`. |
| `unit` / `currency` | Constant `l` and `ISK`. |
| `chainId` / `operatorName` | Constant `n1-is` and `N1`. |
| `sourceKind` | `operator_public_price_page`. |
| `sourceUrl` | The N1 fuel price page URL used for the fetch. |
| `observedAt` / `effectiveFrom` | Fetch timestamp and its ISO date. |
| `provenance` | Parser version, source digest, original price text, and station name when present. |

When multiple stations expose the same fuel grade, the connector keeps the cheapest observed table row per grade and retains the station name as provenance.

## Known quirks and edge cases

- The parser accepts Icelandic decimal commas and strips thousands separators before converting prices.
- It requires a table header that maps to a supported fuel grade; pages without a recognizable fuel table return no rows.
- Colored diesel (`lituð dísel`) is deliberately excluded so tax-restricted fuel does not mix into ordinary pump comparisons.
- Non-`n1.is` source URLs are rejected to avoid accidental provenance drift.
- Captcha, access-denied, or login-like responses throw a blocked-source error instead of emitting partial rows.
- The connector publishes operator page evidence, not a full grocery assortment, and should stay in the fuel domain.

## Verification

- Fixture coverage: `packages/ingestion/src/connectors/__tests__/n1-is.test.ts`.
- Parser version: `n1-is-fuel-prices-v1`.
- Live fetch command path: call `fetchN1IsFuelPrices()` from `@groceryview/ingestion` with the default source URL.
- No live fetch was run for this documentation-only ticket; verification is based on checked-in connector source and fixtures inspected on **2026-05-25**.
