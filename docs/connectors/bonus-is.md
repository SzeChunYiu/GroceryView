# Bónus Iceland connector notes (`bonus-is`)

Last verified: 2026-05-24

## Data source

`bonus-is` should treat Bónus as an Icelandic discount-grocery chain source and keep two public surfaces separate:

1. **Chain/store presence:** `https://bonus.is/english/` is the public chain site and advertises the Iceland store network. Use it only as operator context for the chain identity, store footprint, and customer-facing links.
2. **Online merchandise storefront:** `https://verslun.bonus.is/` is a WooCommerce storefront. The public WooCommerce Store API responds at `https://verslun.bonus.is/wp-json/wc/store/v1/products?per_page=100&page={n}` and reported `X-WP-Total: 42` during verification. Rows observed there are Bónus-branded merchandise/specialty store items, not a full in-store grocery assortment.

The connector must not claim complete Bónus grocery price coverage from the WooCommerce storefront alone.

## Extracted fields

For WooCommerce product rows, extract only fields that are present in the public response:

| Field | Source field | Notes |
| --- | --- | --- |
| `sourceProductId` | `id` | Stable WooCommerce product id. |
| `slug` | `slug` | Use with the permalink for source traceability. |
| `name` | `name` | Product display name. |
| `sku` | `sku` | Often a Bónus merchandise SKU rather than an EAN. |
| `sourceUrl` | `permalink` | Canonical product page. |
| `priceMinor` | `prices.price` | Minor-unit string when supplied by Store API. |
| `currency` | `prices.currency_code` | Expected `ISK` for storefront rows. |
| `regularPriceMinor` | `prices.regular_price` | Keep separate from sale price. |
| `salePriceMinor` | `prices.sale_price` | Optional; do not synthesize discounts. |
| `isInStock` | `is_in_stock` | Storefront stock flag, not branch shelf availability. |
| `categories` | `categories[].name` | Storefront taxonomy, not GroceryView canonical category. |
| `images` | `images[].src` | Cache only after normal image-source checks. |
| `lastObservedAt` | probe timestamp | Connector observation time. |

## Known quirks

- The WooCommerce API is public and paginated, but the product count is small and biased toward merch/specialty online-store items.
- Storefront rows can be language-localized (`/en/vara/...` permalinks appeared in sampled rows), so matching should use ids/SKUs before names.
- `sku` values are not guaranteed to be GTIN/EANs.
- `is_in_stock` is online-store stock only; it is not evidence that an item is available in every Bónus branch.
- The chain site and online storefront are separate WordPress/WooCommerce surfaces with different robots metadata.

## Edge cases

- If the Store API returns zero rows or loses `X-WP-Total`, fail closed and log a connector-health warning instead of emitting an empty successful run.
- If a row lacks price data, keep metadata only and mark price confidence as unavailable.
- If the product is Bónus-branded merchandise rather than food, route it to a non-grocery/specialty category or exclude it from grocery price modules.
- If a product page says out of stock, do not infer historical or branch-level availability.
- If Cloudflare, captcha, login, or rate-limit responses appear, stop automated collection and record the blocker for operator review.

## Robots and access posture

- `https://bonus.is/robots.txt` allows normal crawlers and disallows only bot-traffic user agents in the observed file.
- `https://verslun.bonus.is/robots.txt` allows the WooCommerce/WordPress API surface while disallowing admin, transient, WooCommerce log/upload paths, and add-to-cart URLs.
- `https://verslun.bonus.is/wp-json/wc/store/v1/products` returned HTTP 200 without authentication on 2026-05-24.

Use a descriptive GroceryView user agent, keep request rates low, cache snapshots, and cite Bónus as the source. Do not crawl cart, checkout, account, admin, or add-to-cart URLs.

## Connector status

Status: **verified public source, limited production value**.

The source is suitable for documenting Bónus identity and capturing the small public online-store catalog, but it is not sufficient for Bónus in-store grocery price coverage. A production Iceland grocery connector still needs a separate source for branch/store grocery assortment and prices.
