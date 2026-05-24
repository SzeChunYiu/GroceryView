# GET `/api/price-drops`

Returns the largest verified grocery price drops in a bounded observation window. The endpoint is intended for deal modules, email digests, alert previews, and public comparison pages that need a ranked list of products whose latest observed price is below the previously observed regular price.

## Method and path

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/api/price-drops` | Public read-only endpoint; no bearer token required. |

The response is computed from verified `latest_prices` rows in the grocery domain. A row qualifies only when `regularPrice` is present, `regularPrice > price`, the current `price` is non-negative, and the observation falls inside the requested time window.

## Query parameters

All query parameters are optional unless noted. Unknown parameters should be rejected with `400 invalid_query` so dashboards do not silently believe an unsupported filter was applied.

```ts
import { z } from 'zod';

export const priceDropsQuerySchema = z.object({
  since: z.string().datetime({ offset: true }).optional(),
  until: z.string().datetime({ offset: true }).optional(),
  window: z.enum(['24h', '7d', '30d']).default('7d'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  chainSlug: z.string().trim().min(1).max(80).optional(),
  storeSlug: z.string().trim().min(1).max(120).optional(),
  categorySlug: z.string().trim().min(1).max(120).optional(),
  productSlug: z.string().trim().min(1).max(160).optional(),
  minDropPercent: z.coerce.number().min(0).max(100).default(0),
  minSavingsAmount: z.coerce.number().min(0).default(0),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default('SEK')
}).strict().superRefine((query, ctx) => {
  if ((query.since && !query.until) || (!query.since && query.until)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'since and until must be supplied together'
    });
  }

  if (query.since && query.until && Date.parse(query.since) >= Date.parse(query.until)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'since must be earlier than until'
    });
  }
});
```

### Parameter semantics

| Parameter | Default | Description |
| --- | --- | --- |
| `since` | derived from `window` | Inclusive lower bound for `observedAt`. Must be paired with `until`. |
| `until` | request time | Exclusive upper bound for `observedAt`. Must be paired with `since`. |
| `window` | `7d` | Convenience window used only when `since`/`until` are omitted. |
| `limit` | `10` | Maximum ranked rows returned. The API clamps at `50` to keep public calls cheap. |
| `chainSlug` | none | Restrict to one retailer chain, for example `ica` or `willys`. |
| `storeSlug` | none | Restrict to one store. Usually combined with `chainSlug`. |
| `categorySlug` | none | Restrict to one canonical product category. |
| `productSlug` | none | Restrict to one canonical product. Useful for product detail pages. |
| `minDropPercent` | `0` | Hide rows whose percentage drop is below this threshold. |
| `minSavingsAmount` | `0` | Hide rows whose absolute savings amount is below this threshold. |
| `currency` | `SEK` | ISO-4217 currency code for rows to include. |

## Response shape

Successful responses use `200 OK` and `application/json`.

```ts
type PriceDrop = {
  rank: number;
  productId: string;
  productSlug: string;
  productName: string;
  brand?: string;
  categorySlug?: string;
  categoryName?: string;
  chainSlug: string;
  chainName: string;
  storeSlug?: string;
  storeName?: string;
  priceType: 'regular' | 'member' | 'campaign' | 'clearance' | string;
  price: number;
  regularPrice: number;
  savingsAmount: number;
  dropPercent: number;
  currency: string;
  observedAt: string;
  confidence: number;
  evidence: {
    source: 'postgres.latest_prices';
    rule: 'regular_price_gt_price';
    observedWindow: { since: string; until: string };
  };
  labels: {
    savings: string;
    drop: string;
  };
};

type PriceDropsResponse = {
  source: 'postgres.latest_prices';
  generatedAt: string;
  window: {
    since: string;
    until: string;
    label: '24h' | '7d' | '30d' | 'custom';
  };
  filters: {
    chainSlug?: string;
    storeSlug?: string;
    categorySlug?: string;
    productSlug?: string;
    minDropPercent: number;
    minSavingsAmount: number;
    currency: string;
  };
  itemCount: number;
  items: PriceDrop[];
};
```

Rows are ordered by `dropPercent` descending, then `savingsAmount` descending, then newest `observedAt`. Ties should be stabilized by product, chain, store, and price type so repeated requests produce deterministic ordering.

## Examples

### Default weekly ranking

```bash
curl 'https://api.groceryview.example/api/price-drops'
```

```json
{
  "source": "postgres.latest_prices",
  "generatedAt": "2026-05-24T09:30:00.000Z",
  "window": {
    "since": "2026-05-17T09:30:00.000Z",
    "until": "2026-05-24T09:30:00.000Z",
    "label": "7d"
  },
  "filters": {
    "minDropPercent": 0,
    "minSavingsAmount": 0,
    "currency": "SEK"
  },
  "itemCount": 1,
  "items": [
    {
      "rank": 1,
      "productId": "prod_zoegas_skane_450g",
      "productSlug": "zoegas-skane-450g",
      "productName": "Zoégas Skånerost 450 g",
      "brand": "Zoégas",
      "categorySlug": "coffee",
      "categoryName": "Coffee",
      "chainSlug": "willys",
      "chainName": "Willys",
      "storeSlug": "willys-stockholm-odenplan",
      "storeName": "Willys Stockholm Odenplan",
      "priceType": "campaign",
      "price": 49.9,
      "regularPrice": 69.9,
      "savingsAmount": 20,
      "dropPercent": 28.61,
      "currency": "SEK",
      "observedAt": "2026-05-24T06:12:00.000Z",
      "confidence": 0.97,
      "evidence": {
        "source": "postgres.latest_prices",
        "rule": "regular_price_gt_price",
        "observedWindow": {
          "since": "2026-05-17T09:30:00.000Z",
          "until": "2026-05-24T09:30:00.000Z"
        }
      },
      "labels": {
        "savings": "Save 20.00 SEK",
        "drop": "28.61% drop"
      }
    }
  ]
}
```

### Chain-filtered call with a threshold

```bash
curl 'https://api.groceryview.example/api/price-drops?chainSlug=willys&window=30d&minDropPercent=15&limit=5'
```

### Custom observation window

```bash
curl 'https://api.groceryview.example/api/price-drops?since=2026-05-01T00:00:00.000Z&until=2026-05-08T00:00:00.000Z&currency=SEK'
```

## Error codes

| Status | Code | When it is returned | Client guidance |
| --- | --- | --- | --- |
| `400` | `invalid_query` | Query parameters fail the Zod schema, an unknown key is present, or `since >= until`. | Correct the query and retry. |
| `404` | `chain_not_found`, `store_not_found`, `category_not_found`, `product_not_found` | A slug filter references a known entity type but no matching record exists. | Remove or refresh the stale slug. |
| `429` | `rate_limited` | The caller exceeded the public read quota. | Back off and retry after the `Retry-After` header. |
| `500` | `price_drops_query_failed` | The database query or row mapping failed unexpectedly. | Retry later; server logs should include a sanitized diagnostic. |
| `503` | `price_drops_database_unconfigured` | `DATABASE_URL` is absent or the price database is intentionally unavailable. | Treat as a temporary service outage and show cached or empty-state UI. |

Error responses still use JSON:

```json
{
  "error": "invalid_query",
  "message": "since and until must be supplied together",
  "details": [
    { "path": ["until"], "message": "required when since is provided" }
  ]
}
```

## Rate limit

- Public unauthenticated clients: `60` requests per minute per IP.
- Authenticated internal dashboards or server-to-server callers: `600` requests per minute per token.
- Responses should include `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After` on `429`.
- Cacheable successful responses may be served with `Cache-Control: public, max-age=60, stale-while-revalidate=300` because price observations are append/update driven rather than user-specific.

## Change history

| Date | Change |
| --- | --- |
| 2026-05-24 | Initial contract documentation for `GET /api/price-drops`, including Zod query schema, response shape, error codes, rate limit, examples, and backing `latest_prices` evidence rules. |
