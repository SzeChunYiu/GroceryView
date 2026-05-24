# GET `/api/v1/products/{id}/history`

Public product price-history contract for charting a product's observed price tape across chains, stores, and price types. The endpoint returns persisted observations only; it does not infer missing dates from current quotes, forecasts, or synthetic regular prices.

> Implementation note: the Nest service currently exposes the same report builder through `GET /products/{productId}/price-history`. The versioned public gateway should route `/api/v1/products/{id}/history` to that handler without changing the response semantics documented here.

## Method and path

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/api/v1/products/{id}/history` | Public read-only endpoint; no bearer token required. |

`id` may be either the canonical product UUID/id or the public product slug. Successful responses are JSON and are safe for public product detail pages, price-history charts, alert previews, and audit views that need observation provenance.

### Path parameter

```ts
import { z } from 'zod';

export const productHistoryPathSchema = z.object({
  id: z.string().trim().min(1).max(160).regex(/^[a-zA-Z0-9:_-]+$/, 'id must be a product slug or id')
}).strict();
```

## Query parameters

All query parameters are optional. Unknown query keys should be rejected with `400 invalid_query` so clients never assume an unsupported filter was applied.

```ts
export const productHistoryQuerySchema = z.object({
  priceType: z.enum([
    'shelf',
    'online',
    'member',
    'promotion',
    'receipt',
    'community',
    'estimated'
  ]).optional(),
  chain: z.string().trim().regex(/^[a-zA-Z0-9:_-]+$/, 'chain must be a slug or id').optional(),
  store: z.string().trim().regex(/^[a-zA-Z0-9:_-]+$/, 'store must be a slug or id').optional(),
  sourceRun: z.string().trim().regex(/^[a-zA-Z0-9:_-]+$/, 'sourceRun must be a slug or id').optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
  locale: z.string().trim().min(2).max(12).optional()
}).strict().superRefine((query, ctx) => {
  if (query.from && query.to && Date.parse(query.from) > Date.parse(query.to)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['from'],
      message: 'from must be before or equal to to'
    });
  }
});
```

### Parameter semantics

| Parameter | Default | Description |
| --- | --- | --- |
| `priceType` | all types | Restricts the series to one observation type. Values stay explicit in each point so UIs can avoid mixing shelf, member, promotion, receipt, community, or estimated rows without labeling them. |
| `chain` | all chains | Chain slug or chain id, for example `willys`. |
| `store` | all stores | Store slug or store id. Usually combined with `chain` when rendering a single-store tape. |
| `sourceRun` | all source runs | Ingestion run id used to audit a specific scrape/import batch. |
| `minConfidence` | no minimum | Numeric lower bound from `0` to `1`; `0.9` returns only high-confidence observations. |
| `from` | none | Inclusive lower bound for `observedAt`; must be an ISO date/time with offset. |
| `to` | none | Inclusive upper bound for `observedAt`; must be an ISO date/time with offset and cannot be earlier than `from`. |
| `limit` | `500` | Maximum observations returned after filtering. The public cap is `1000`. |
| `locale` | negotiated by headers | Optional product-name locale override. The service may also honor `X-GroceryView-Locale`, `Accept-Language`, and locale cookies. |

## Response shape

Successful responses use `200 OK` and `application/json`.

```ts
type ProductHistoryPriceType =
  | 'shelf'
  | 'online'
  | 'member'
  | 'promotion'
  | 'receipt'
  | 'community'
  | 'estimated';

type ProductHistoryPoint = {
  observationId: string;
  productId: string;
  productSlug: string;
  productName: string;
  chainId: string;
  chainSlug?: string;
  chainName?: string;
  storeId?: string;
  storeSlug?: string;
  storeName?: string;
  sourceRunId?: string;
  rawRecordId?: string;
  retailerProductRef?: string;
  priceType: ProductHistoryPriceType;
  price: number;
  regularPrice?: number;
  unitPrice: number;
  currency: 'SEK';
  quantity?: number;
  quantityUnit?: string;
  promotionText?: string;
  promotionStartsOn?: string;
  promotionEndsOn?: string;
  memberRequired: boolean;
  observedAt: string;
  validFrom?: string;
  validUntil?: string;
  confidence: number;
  provenance: Record<string, unknown>;
};

type PriceHistorySummary = {
  latestPrice: number;
  previousPrice: number | null;
  lowestPrice: number;
  highestPrice: number;
  changeFromPrevious: number | null;
  changeFromPreviousPercent: number | null;
  observedPoints: number;
  verifiedPoints: number;
  observedFrom: string;
  observedTo: string;
  latestObservedAt: string;
  isNewLow: boolean;
};

type ProductHistoryResponse = {
  productId: string;
  productSlug: string;
  productName: string;
  currency: 'SEK';
  filters: {
    priceType?: ProductHistoryPriceType;
    chain?: string;
    store?: string;
    sourceRun?: string;
    minConfidence?: number;
    observedFrom?: string;
    observedTo?: string;
    limit?: number;
  };
  pointCount: number;
  observedFrom: string | null;
  observedTo: string | null;
  priceTypes: ProductHistoryPriceType[];
  points: ProductHistoryPoint[];
  summary: PriceHistorySummary | null;
  evidence: {
    observationCount: number;
    sourceTables: Array<'products' | 'observations' | 'chains' | 'stores'>;
  };
  guardrails: string[];
};
```

`points` are sorted oldest to newest by `observedAt`, then by `observationId` for deterministic rendering. Empty history is still a `200 OK` response when the product exists but no rows match the selected filters; in that case `pointCount` is `0`, `points` is empty, date bounds are `null`, and `summary` is `null`.

## Examples

### Product history with high-confidence Willys shelf prices

```bash
curl 'https://api.groceryview.example/api/v1/products/bryggkaffe-450g/history?priceType=shelf&chain=willys&minConfidence=0.9&limit=5'
```

```json
{
  "productId": "product-coffee",
  "productSlug": "bryggkaffe-450g",
  "productName": "Bryggkaffe mellanrost 450 g",
  "currency": "SEK",
  "filters": {
    "priceType": "shelf",
    "chain": "willys",
    "minConfidence": 0.9,
    "limit": 5
  },
  "pointCount": 2,
  "observedFrom": "2026-05-18T09:00:00.000Z",
  "observedTo": "2026-05-19T09:00:00.000Z",
  "priceTypes": ["shelf"],
  "points": [
    {
      "observationId": "obs-coffee-old",
      "productId": "product-coffee",
      "productSlug": "bryggkaffe-450g",
      "productName": "Bryggkaffe mellanrost 450 g",
      "chainId": "chain-willys",
      "chainSlug": "willys",
      "chainName": "Willys",
      "storeId": "store-willys-odenplan",
      "storeSlug": "willys-odenplan",
      "storeName": "Willys Odenplan",
      "priceType": "shelf",
      "price": 59.9,
      "unitPrice": 133.11,
      "currency": "SEK",
      "memberRequired": false,
      "observedAt": "2026-05-18T09:00:00.000Z",
      "confidence": 0.95,
      "provenance": {
        "source": "open_prices",
        "rawSnapshotRef": "s3://raw/coffee-old.html"
      }
    },
    {
      "observationId": "obs-coffee-new",
      "productId": "product-coffee",
      "productSlug": "bryggkaffe-450g",
      "productName": "Bryggkaffe mellanrost 450 g",
      "chainId": "chain-willys",
      "chainSlug": "willys",
      "chainName": "Willys",
      "storeId": "store-willys-odenplan",
      "storeSlug": "willys-odenplan",
      "storeName": "Willys Odenplan",
      "priceType": "shelf",
      "price": 49.9,
      "regularPrice": 59.9,
      "unitPrice": 110.89,
      "currency": "SEK",
      "memberRequired": false,
      "observedAt": "2026-05-19T09:00:00.000Z",
      "confidence": 0.94,
      "provenance": {
        "source": "open_prices",
        "rawSnapshotRef": "s3://raw/coffee-new.html"
      }
    }
  ],
  "summary": {
    "latestPrice": 49.9,
    "previousPrice": 59.9,
    "lowestPrice": 49.9,
    "highestPrice": 59.9,
    "changeFromPrevious": -10,
    "changeFromPreviousPercent": -16.69,
    "observedPoints": 2,
    "verifiedPoints": 2,
    "observedFrom": "2026-05-18T09:00:00.000Z",
    "observedTo": "2026-05-19T09:00:00.000Z",
    "latestObservedAt": "2026-05-19T09:00:00.000Z",
    "isNewLow": true
  },
  "evidence": {
    "observationCount": 2,
    "sourceTables": ["products", "observations", "chains", "stores"]
  },
  "guardrails": [
    "Price history is built only from persisted observation rows for the selected product.",
    "Member, promotion, estimated, receipt, and community rows remain explicitly labeled in the series.",
    "Provenance identifiers stay attached so UI and audit flows can trace each point back to ingestion evidence."
  ]
}
```

### Bounded source-run audit

```bash
curl 'https://api.groceryview.example/api/v1/products/product-coffee/history?sourceRun=run-open-prices-1&from=2026-05-01T00:00:00.000Z&to=2026-05-31T23:59:59.000Z'
```

### Existing product with no matching rows

```json
{
  "productId": "product-coffee",
  "productSlug": "bryggkaffe-450g",
  "productName": "Bryggkaffe mellanrost 450 g",
  "currency": "SEK",
  "filters": {
    "priceType": "promotion",
    "sourceRun": "run-without-coffee-prices",
    "limit": 25
  },
  "pointCount": 0,
  "observedFrom": null,
  "observedTo": null,
  "priceTypes": [],
  "points": [],
  "summary": null,
  "evidence": {
    "observationCount": 0,
    "sourceTables": ["products", "observations", "chains", "stores"]
  },
  "guardrails": [
    "Price history is built only from persisted observation rows for the selected product.",
    "No observations are returned when ingestion has not produced rows for the selected filters.",
    "Missing history stays explicit instead of inferring movement from current store quotes."
  ]
}
```

## Error codes

| Status | Code | When it is returned | Client guidance |
| --- | --- | --- | --- |
| `400` | `invalid_query` | Query parameters fail the Zod schema, `from` is after `to`, `limit` is outside `1..1000`, `minConfidence` is outside `0..1`, or an identifier contains unsupported characters. | Correct the query and retry. |
| `404` | `product_not_found` | `{id}` does not match a known product id or slug. | Refresh the catalog or remove the stale product link. |
| `429` | `rate_limited` | The caller exceeded the public read quota. | Back off and retry after the `Retry-After` header. |
| `500` | `product_history_query_failed` | The database query, provenance JSON parsing, or response mapping failed unexpectedly. | Retry later; server logs should include sanitized diagnostics. |
| `503` | `product_history_database_unconfigured` | `DATABASE_URL` is absent or the price-history database is intentionally unavailable. | Treat as a temporary service outage and show cached data or an explicit empty-state UI. |

Error responses use JSON:

```json
{
  "error": "invalid_query",
  "message": "from must be before or equal to to",
  "details": [
    { "path": ["from"], "message": "from must be before or equal to to" }
  ]
}
```

## Rate limit

- Public unauthenticated clients: `60` requests per minute per IP.
- Authenticated internal dashboards or server-to-server callers: `600` requests per minute per token.
- Responses should include `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After` on `429`.
- Successful responses may be cached with `Cache-Control: public, max-age=60, stale-while-revalidate=300` when they do not include user-specific localization headers.
- Cache keys must include `{id}`, all query parameters, and locale negotiation inputs because product names may be localized.

## Change history

| Date | Change |
| --- | --- |
| 2026-05-24 | Initial public v1 product price-history API contract, including method/path, Zod query schema, response shape, examples, error codes, rate limits, and persisted-observation guardrails. |
