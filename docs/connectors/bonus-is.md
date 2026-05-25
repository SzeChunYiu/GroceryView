# Bónus IS connector

`npm run ops:check-bonus-is-connector` builds `@groceryview/ingestion`, fetches a small Bónus IS WooCommerce sample, and prints a JSON health record for the chain-study connector matrix.

## Source pulled

- Chain id: `bonus-is`.
- Source URLs: `https://verslun.bonus.is/` and `https://verslun.bonus.is/en/`.
- Page shape: WooCommerce product listing HTML (`li.product` cards), not a JSON API.
- Runtime entry points: `fetchBonusIsProducts()` and `checkBonusIsConnectorHealth()` in `packages/ingestion/src/connectors/bonus-is.ts`.

## Extracted fields

Each accepted row is normalized into `BonusIsProduct`:

| Field | Source / rule |
| --- | --- |
| `chain` | Constant `bonus-is`. |
| `code` | `.sku` text when present; otherwise product URL slug; otherwise a stable slug from the product name. |
| `name` | `h2.woocommerce-loop-product__title` text with HTML entities decoded. |
| `price` / `priceText` | First `.woocommerce-Price-amount` text parsed as Icelandic króna, stripping thousand separators and currency text. |
| `productUrl` | First product-card anchor resolved against the source URL. |
| `imageUrl` | First `img` `data-src` or `src`, resolved against the source URL. |
| `inStock` | `false` when the card contains WooCommerce out-of-stock markers or matching Icelandic/English text. |
| `sourceUrl` / `retrievedAt` | The listing URL and fetch timestamp used for provenance. |

Rows without `name`, `productUrl`, or parseable `price` are dropped fail-closed.

## Known quirks and edge cases

- The storefront can emit duplicate products across Icelandic and English listing pages; rows dedupe by `chain:code`.
- SKU is not guaranteed, so URL slug fallback is part of the stable identity contract.
- Prices use Icelandic formatting such as `9.999 kr.`; parser removes `.` thousands and accepts comma decimals.
- Images may be lazy-loaded in `data-src`; the connector checks `data-src` before `src`.
- Availability is inferred from listing-card CSS/text only; final stock must be reconfirmed before checkout.
- The source is HTML and can break if WooCommerce classes change. The health check fails when required fields are absent.

## Health check contract

The health record includes `rowCount`, per-field non-empty counts for `name`, `price`, `productUrl`, and `imageUrl`, plus an `error` string when the HTTP fetch fails. The command exits non-zero if no rows are returned, required fields are missing, or the fetch fails.

Use `-- --maxRows 10` to raise the default five-row sample while keeping the check bounded for ops runs.

## Last verified

- Last verified in-repo: 2026-05-25 via connector tests and the ops smoke contract.
- Live verification command: `npm run ops:check-bonus-is-connector -- --maxRows 5`.
