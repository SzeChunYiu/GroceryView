# Stores API

Documents the public store-directory contract used by GroceryView clients.

## `GET /api/stores`

Returns the known grocery stores that can be used for store profiles, favorite-store
selection, and store-scoped deal surfaces. The endpoint is public and does not require
a bearer token.

> Runtime note: `packages/server` serves the list endpoint at `/api/stores`. The Nest
> API app exposes the same list at `/stores` and the database-backed geo lookup at
> `/stores/nearest`; deployments that mount the Nest app behind an `/api` prefix should
> expose that geo lookup as `/api/stores/nearest`.

### Query parameters

The plain list endpoint accepts no required query parameters. Geo lookup clients should
use the nearest-store variant with the following query schema.

```ts
import { z } from 'zod';

export const storeListQuerySchema = z.object({}).strict();

export const nearestStoresQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().default(10),
  chain: z.string().trim().min(1).optional()
});
```

| Parameter | Required | Description |
| --- | --- | --- |
| `lat` | Geo only | Shopper latitude in decimal degrees. Must be finite and between -90 and 90. |
| `lng` | Geo only | Shopper longitude in decimal degrees. Must be finite and between -180 and 180. |
| `radius` | No | Search radius in kilometres for geo lookup. Defaults to `10`; must be greater than zero. |
| `chain` | No | Optional retailer chain slug such as `coop`, `willys`, or `lidl`. |

### Store list response shape

`200 OK` returns a JSON array of store summaries.

```ts
export const storeSummarySchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  chain: z.string().trim().min(1),
  district: z.string().trim().min(1),
  address: z.string().trim().min(1),
  openingHours: z.array(z.string().trim().min(1)),
  confidence: z.enum(['high', 'medium', 'low'])
});

export const storesResponseSchema = z.array(storeSummarySchema);
```

Example:

```bash
curl -s https://api.groceryview.example/api/stores
```

```json
[
  {
    "id": "willys-odenplan",
    "name": "Willys Odenplan",
    "chain": "willys",
    "district": "Odenplan",
    "address": "Odenplan, Stockholm",
    "openingHours": ["Mon-Fri 08:00-22:00", "Sat-Sun 09:00-21:00"],
    "confidence": "high"
  }
]
```

### Geo lookup response shape

Use the geo lookup when the client needs distance-sorted stores near a shopper.

```bash
curl -s 'https://api.groceryview.example/api/stores/nearest?lat=59.3293&lng=18.0686&radius=5&chain=coop'
```

```ts
export const nearestStoreSchema = z.object({
  id: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  chain: z.string().trim().min(1),
  address: z.string().trim().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  distanceKm: z.number().nonnegative()
});

export const nearestStoresResponseSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().positive(),
  chain: z.string().trim().min(1).nullable(),
  stores: z.array(nearestStoreSchema)
});
```

Example response:

```json
{
  "lat": 59.3293,
  "lng": 18.0686,
  "radiusKm": 5,
  "chain": "coop",
  "stores": [
    {
      "slug": "coop-odenplan",
      "name": "Coop Odenplan",
      "chain": "coop",
      "distanceKm": 1.86
    }
  ]
}
```

### Error codes

| Status | When | Body shape |
| --- | --- | --- |
| `200` | Store list or nearest-store lookup succeeded. | Array of store summaries, or geo lookup envelope. |
| `400` | Geo query is malformed: missing `lat`/`lng`, non-finite values, out-of-range coordinates, non-positive `radius`, or unexpected list query parameters. | `{ "message": string }` from the Nest API, or `{ "error": string }` from the lower-level server handler. |
| `404` | Not returned by `GET /api/stores`; store-detail endpoints such as `/api/stores/{id}` use `404` for unknown store ids. | `{ "error": "Store not found." }` or framework equivalent. |
| `429` | No in-repository handler currently emits `429` for this endpoint. Production edge infrastructure may add IP or token based throttling. | Edge-defined error envelope. |
| `503` | Geo lookup cannot run because the database-backed nearest-store service is not configured. | Framework error with a message such as `DATABASE_URL is required for nearest-store lookups.` |

### Rate limit guidance

The repository does not enforce an application-level rate limiter for `GET /api/stores`.
Recommended edge policy for public deployments is **60 requests per minute per IP** with
short CDN caching for the list response. Geo lookup should be rate-limited more
conservatively when backed by Postgres/PostGIS because each request performs distance
sorting.

### Change history

| Date | Change |
| --- | --- |
| 2026-05-24 | Initial stores API documentation with Zod query schemas, response shapes, examples, error codes, and rate-limit guidance. |
