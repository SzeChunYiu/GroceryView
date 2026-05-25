# GET `/api/stores`

Returns grocery stores near a shopper-supplied coordinate, sorted by Haversine distance. Use this endpoint for store pickers, map results, and location-aware price/deal entry points.

## Method and path

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/api/stores` | Public read-only endpoint; no bearer token required. |

When `lat` and `lng` are supplied the response is a geo query. If a runtime still exposes the rollout route as `/api/stores/nearest`, the request and response contract below is identical.

## Query parameters

The API validates query strings with this Zod contract. Unknown keys are rejected so clients do not assume unsupported filters were applied.

```ts
import { z } from 'zod';

export const storesGeoQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(100).default(10),
  chain: z.string().trim().min(1).max(80).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(50)
}).strict();
```

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `lat` | yes | none | Shopper latitude in decimal degrees. |
| `lng` | yes | none | Shopper longitude in decimal degrees. |
| `radius` | no | `10` | Search radius in kilometers; clamped to `100` km. |
| `chain` | no | none | Optional chain slug or id, for example `willys`, `ica`, `coop`, or `hemkop`. |
| `limit` | no | `50` | Maximum stores returned after distance sorting. |

## Response shape

Successful responses use `200 OK` and `application/json`.

```ts
type StoreSearchResult = {
  id: string;
  slug: string;
  name: string;
  chain: {
    slug: string;
    name: string;
  };
  addressLine1: string | null;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

type StoresGeoResponse = {
  lat: number;
  lng: number;
  radiusKm: number;
  chain: string | null;
  stores: StoreSearchResult[];
};
```

Rows are ordered by `distanceKm` ascending, then store name ascending. `distanceKm` is computed server-side from the requested coordinate and the stored branch coordinate.

## Examples

### Nearby stores around Stockholm City

```bash
curl 'https://api.groceryview.example/api/stores?lat=59.3293&lng=18.0686&radius=5&limit=3'
```

```json
{
  "lat": 59.3293,
  "lng": 18.0686,
  "radiusKm": 5,
  "chain": null,
  "stores": [
    {
      "id": "store_01HX7WILLYS_ODENPLAN",
      "slug": "willys-odenplan",
      "name": "Willys Odenplan",
      "chain": { "slug": "willys", "name": "Willys" },
      "addressLine1": "Odengatan 65",
      "city": "Stockholm",
      "latitude": 59.3429,
      "longitude": 18.047,
      "distanceKm": 2.16
    }
  ]
}
```

### Chain-filtered geo lookup

```bash
curl 'https://api.groceryview.example/api/stores?lat=59.3293&lng=18.0686&radius=10&chain=coop'
```

## Error codes

| Status | Code | When it is returned | Client guidance |
| --- | --- | --- | --- |
| `400` | `invalid_query` | Query parameters fail the Zod schema, an unknown key is present, or coordinates are outside valid ranges. | Correct the query and retry. |
| `404` | `chain_not_found` | `chain` references a chain id/slug that is not known in the store catalog. | Refresh chain metadata or remove the filter. |
| `429` | `rate_limited` | The caller exceeded the public geo-read quota. | Back off and retry after the `Retry-After` header. |
| `500` | `stores_query_failed` | Store lookup or row mapping failed unexpectedly. | Retry later; server logs should include a sanitized diagnostic. |
| `503` | `stores_database_unconfigured` | The database-backed geo store reader is unavailable or `DATABASE_URL` is not configured. | Show a cached/manual store picker and retry later. |

Error responses use the standard JSON envelope:

```json
{
  "ok": false,
  "error": {
    "code": "invalid_query",
    "message": "lat must be between -90 and 90",
    "details": [{ "path": ["lat"], "message": "Number must be less than or equal to 90" }]
  }
}
```

## Rate limit

Public store geo lookups are limited to **60 requests per minute per IP** and **600 requests per hour per IP**. `429 rate_limited` responses include `Retry-After` in seconds. Authenticated first-party clients may receive higher quotas, but must still debounce map pans and autocomplete-driven geo calls.

## Change history

| Date | Change |
| --- | --- |
| 2026-05-25 | Documented the geo query contract for `GET /api/stores`, including validation schema, response shape, errors, rate limits, and examples. |
