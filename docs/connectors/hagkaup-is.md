# Hagkaup Iceland connector notes (`hagkaup-is`)

Last verified: 2026-05-25 (Europe/Stockholm; live probe against `www.hagkaup.is` and its JSON routes).
Status: 🧪 verified discovery only — no production ingestion job is wired yet.

## Source surface

The Hagkaup storefront is a Next.js site backed by product JSON exposed through the public `www.hagkaup.is` origin. The current frontend renders static/SSR data from `__NEXT_DATA__` and calls public Next API routes for search and product details.

Primary read-only endpoints observed:

| Purpose | Endpoint | Notes |
|---|---|---|
| Search / catalog discovery | `GET https://www.hagkaup.is/api/search?search={term}` | Returns JSON with `items`, `aggregations`, and `pageInfo` for many terms. `pageInfo` contains `currentPage`, `pageSize`, and `totalPages`; pagination support should be re-probed before bulk use. |
| Product detail | `GET https://www.hagkaup.is/api/products/{slug}` | Slug is the full storefront slug, e.g. `tree-hut-vanilla-overnight-lip-mask-1257693`. Plain SKU-only paths returned 404 in the probe. |
| Static page seed data | `GET https://www.hagkaup.is/` and category/product pages | HTML includes `__NEXT_DATA__` with Prismic content blocks and embedded product cards. Useful as a fallback for featured products, but the API routes are cleaner for connector ingestion. |
| Product images | `https://mcprod.mobileapp.is/media/catalog/product/...` | Image CDN referenced by search and product-detail payloads. Keep as source URL metadata; do not hotlink in generated datasets unless product-image licensing is reviewed. |

The storefront also loads Prismic content (`static.cdn.prismic.io` / `images.prismic.io`) for banners and editorial content. Those fields are not a price source and should not be mixed into product observations except for source-page provenance.

## Fields extracted

Search result rows currently expose enough data for chain-level catalog/price observations:

- `uid`: base64-like internal product id.
- `sku`: retailer SKU / product number.
- `name`: product display name.
- `slug`: storefront slug used for the detail endpoint and product URL.
- `brand` and `brandUrl`.
- `breadcrumbs[]`: category names and `urlPath` values.
- `image.url` and `image.label`.
- `stockStatus`: e.g. `IN_STOCK`.
- `regularPrice`, `priceMin`, `priceMax`: integer ISK values as displayed by the storefront.
- `discountMin`, `discountMax`: nullable discount-range fields.
- `labels[]`, `takkProduct`, `hasVariants`, `variants`.
- `productLinkType`: usually `internal` for normal products.

Product detail rows add optional enrichment fields:

- `description`, `summary`, `ingredients`, `instructions`, `warnings`.
- `images[]` with image/video metadata.
- `assortment`, `vottanir`, `cateringIcons`.
- `relatedProducts` and `relatedBrandProducts`.
- the same price, stock, SKU, slug, brand, breadcrumb, label, and variant fields as search rows.

Suggested GroceryView mapping:

| Hagkaup field | GroceryView field |
|---|---|
| `sku` | `retailerProductId` / chain-local product key |
| `slug` | source URL suffix `/vara/{slug}` and detail API key |
| `name` | `rawName` and initial `canonicalName` |
| `brand` | `brand` when non-empty |
| deepest `breadcrumbs[].urlPath` | candidate `categoryId` after Icelandic-to-GroceryView category mapping |
| `priceMin` / `priceMax` / `regularPrice` | chain-level current price in ISK; use `priceMin` only when variants are absent or after variant handling is implemented |
| `stockStatus` | availability flag (`IN_STOCK` -> available, other values require explicit mapping) |
| `image.url` | product image evidence URL |

## Known quirks and edge cases

- **Not per-branch.** The observed API is the online Hagkaup catalog, not a store-specific branch price feed. Treat observations as `chainId=hagkaup-is` / online-catalog evidence unless a separate store or delivery-zone endpoint is discovered.
- **ISK integer prices.** Prices are returned as integers in Icelandic krónur. Keep currency as `ISK`; do not divide by 100.
- **Variant ranges.** `priceMin`/`priceMax`, `discountMin`/`discountMax`, `hasVariants`, and `variants` indicate grouped products. The first connector should either expand variants from the product detail payload or skip range-only rows to avoid storing a synthetic single-SKU price.
- **Slug required for detail.** `GET /api/products/{sku}` returned 404 during verification, while `GET /api/products/{slug}` succeeded. Persist the slug from search/category rows before fetching detail.
- **Search parameter name is `search`.** `?search=milk` returned product hits; `?query=milk` and `?search-search=milk` returned an empty result shape in the probe.
- **Search can be broad/non-grocery.** Hagkaup sells cosmetics, toys, clothing, household goods, and food. Category filtering is mandatory before using rows in grocery comparisons.
- **Some terms return culturally mixed matches.** Icelandic and English terms can both work, but relevance varies; seed queries should include Icelandic grocery words and category URLs, not only English grocery terms.
- **CMS versus commerce data.** `__NEXT_DATA__` includes Prismic marketing content and product cards. Use it for discovery and provenance only; prefer `/api/search` and `/api/products/{slug}` for normalized commerce records.
- **Cache/SSG behavior.** Responses are served from Vercel/Next with `cache-control: public, max-age=0, must-revalidate` and weak ETags on some routes. Connector snapshots should store retrieval time and response ETag when present.
- **Legal posture.** Public unauthenticated reads were verified. Use a descriptive User-Agent, low request rates, and snapshot storage. Do not republish Hagkaup's catalog wholesale or product images without review.

## Minimal probe recipe

```bash
curl -L --compressed \
  -A 'GroceryView ingestion probe (contact: ops@groceryview.example)' \
  'https://www.hagkaup.is/api/search?search=milk'

curl -L --compressed \
  -A 'GroceryView ingestion probe (contact: ops@groceryview.example)' \
  'https://www.hagkaup.is/api/products/tree-hut-vanilla-overnight-lip-mask-1257693'
```

Expected search shape (abridged):

```json
{
  "items": [
    {
      "sku": "1206959",
      "name": "Cleansing Milk 150ml",
      "slug": "sensai-cleansing-milk-150ml-1206959",
      "stockStatus": "IN_STOCK",
      "regularPrice": 12699,
      "priceMin": 12699,
      "priceMax": 12699
    }
  ],
  "pageInfo": { "currentPage": 1, "pageSize": 20, "totalPages": 6 }
}
```

## Chain-study link note

This connector belongs in the international chain-study backlog as an Iceland (`IS`) chain-level online catalog source. It can support assortment and current online-price benchmarking for Icelandic products after category filters and variant handling are implemented, but it should not be presented as branch-level Hagkaup store pricing.
