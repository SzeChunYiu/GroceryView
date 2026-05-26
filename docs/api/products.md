# GET `/api/products`

Returns up to eight grocery product search results from the PostgreSQL product catalog. The endpoint is intended for the public products page, global search, autocomplete follow-through, and comparison flows that need ranked grocery-domain products with synonym and fuzzy-query expansion metadata.

## Method and path

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/api/products` | Public read-only endpoint; no bearer token required. |

The route runs on the Node.js runtime and is marked dynamic. Results come from `products` rows where `domain = 'grocery'`, ranked by the database full-text/fuzzy search helper and deduplicated across expanded query batches.

## Query parameters

The API validates query strings with this Zod contract. Unknown keys are rejected so clients do not assume unsupported filters were applied.

```ts
import { z } from 'zod';

export const productSearchQuerySchema = z.object({
  q: z.string().trim().max(120).default('')
}).strict();
```

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `q` | no | empty string | Product search text. The value is trimmed and capped at 120 characters. Queries shorter than two characters return an empty result set with telemetry instead of touching the database. |

Repeated `q` parameters, for example `?q=milk&q=coffee`, are rejected because the route converts duplicates to an array before strict Zod validation.

## Response shape

Successful responses use `200 OK` and `application/json`.

```ts
type SearchExplanationBadge = {
  kind: 'name' | 'brand' | 'category' | 'barcode' | 'synonym' | 'phonetic';
  label: string;
  matchedTerms: string[];
};

type ProductSearchResult = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  searchRank: number;
  searchExplanationBadges: SearchExplanationBadge[];
};

type ProductsSearchResponse = {
  query: string;
  expandedQueries: string[];
  matchedAliases: string[];
  matchedSynonyms: string[];
  matchedFuzzyAliases?: string[];
  results: ProductSearchResult[];
  performanceTelemetry: {
    cacheHit: boolean;
    cacheHitRate: number;
    latencyMs: number;
    resultCount: number;
    timedOut: boolean;
    timeoutRate: number;
  };
  source: 'postgres.products_tsvector_alias_synonym_expansion';
  error?: 'product_search_database_unconfigured' | 'product_search_query_failed';
};
```

Rows are ordered by descending `searchRank`, then Swedish locale product name. The route queries each expanded search term with limit `8`, merges duplicate product ids by keeping the strongest rank, and returns at most eight products.

## Examples

### Search for milk

```bash
curl 'https://api.groceryview.example/api/products?q=mjolk'
```

```json
{
  "query": "mjolk",
  "expandedQueries": ["mjolk", "mjölk", "milk"],
  "matchedAliases": ["mjölk"],
  "matchedSynonyms": ["milk"],
  "results": [
    {
      "id": "prod_arla_mellanmjolk_1l",
      "slug": "arla-mellanmjolk-1l",
      "name": "Arla Mellanmjölk 1 l",
      "brand": "Arla",
      "imageUrl": "https://images.groceryview.example/products/arla-mellanmjolk-1l.jpg",
      "searchRank": 0.91,
      "searchExplanationBadges": [
        { "kind": "name", "label": "name match", "matchedTerms": ["mjolk"] },
        { "kind": "synonym", "label": "synonym match", "matchedTerms": ["mjölk", "milk"] }
      ]
    }
  ],
  "performanceTelemetry": {
    "cacheHit": true,
    "cacheHitRate": 0.82,
    "latencyMs": 24,
    "resultCount": 1,
    "timedOut": false,
    "timeoutRate": 0.01
  },
  "source": "postgres.products_tsvector_alias_synonym_expansion"
}
```

### Empty or one-character query

```bash
curl 'https://api.groceryview.example/api/products?q=m'
```

```json
{
  "query": "m",
  "expandedQueries": ["m"],
  "matchedAliases": [],
  "matchedSynonyms": [],
  "results": [],
  "performanceTelemetry": {
    "cacheHit": false,
    "cacheHitRate": 0,
    "latencyMs": 1,
    "resultCount": 0,
    "timedOut": false,
    "timeoutRate": 0
  },
  "source": "postgres.products_tsvector_alias_synonym_expansion"
}
```

### Invalid query parameter

```bash
curl 'https://api.groceryview.example/api/products?q=coffee&limit=20'
```

```json
{
  "error": "invalid_product_search_params",
  "issues": [
    {
      "path": "limit",
      "code": "unrecognized_keys",
      "message": "Unrecognized key(s) in object: 'limit'"
    }
  ]
}
```

## Error codes

| Status | Code | When it is returned | Client guidance |
| --- | --- | --- | --- |
| `400` | `invalid_product_search_params` | Query parameters fail the Zod schema, an unknown key is present, `q` is longer than 120 characters, or `q` is repeated. | Correct the query string and retry. |
| `429` | `rate_limited` | The caller exceeded the public product-search quota at the edge or API gateway. | Back off and retry after the `Retry-After` header. |
| `500` | `product_search_query_failed` | Database import, query execution, row mapping, or product expansion failed unexpectedly. | Retry later; clients should show an empty-state search result and preserve the typed query. |
| `503` | `product_search_database_unconfigured` | `DATABASE_URL` is absent or the search database is intentionally unavailable. | Treat as a temporary service outage and show cached or offline search affordances. |

Validation errors return `issues` from Zod with `path`, `code`, and `message`. Runtime/database errors keep the normal response envelope, include `results: []`, and set the `error` field.

## Rate limit

- Public unauthenticated clients: `60` requests per minute per IP.
- Authenticated first-party dashboards or server-to-server callers: `600` requests per minute per token.
- `429 rate_limited` responses should include `Retry-After` in seconds plus `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` when available.
- Debounce typeahead/search-as-you-type clients to avoid burning quota; the route itself returns an empty result for queries shorter than two characters.

## Change history

| Date | Change |
| --- | --- |
| 2026-05-25 | Documented the `GET /api/products` contract, including Zod query validation, response shape, errors, rate limits, examples, and search telemetry fields. |
