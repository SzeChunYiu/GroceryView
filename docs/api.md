# GroceryView public API

GroceryView exposes a small public API for researchers, journalists, and civic reuse. Endpoints in this document are unauthenticated unless explicitly stated, rate-limited, and return only source-backed observations. Do not treat the data as investment, nutrition, medical, or shopping advice.

## Licensing

- API implementation code is licensed under Apache-2.0.
- Exported observation data is licensed under CC-BY-4.0.
- Reuse must credit GroceryView and preserve row-level provenance fields such as `sourceRunId`, `rawRecordId`, and `provenance` when republishing.

## `GET /api/v1/products/{id}/history`

Open JSON price-history export for a single product UUID. The route is intended for researchers and journalists who need source-backed shelf, online, member, promotion, receipt, or community price observations without scraping GroceryView pages.

### Rate limit

The endpoint allows 60 requests per minute per client IP. Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`. When the limit is exceeded, the API returns `429` with `Retry-After`.

### Query parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `limit` | No | Integer from 1 to 1000. Defaults to 200. |
| `price_type` | No | One of `shelf`, `online`, `member`, `promotion`, `receipt`, or `community`. |
| `chain_id` | No | Retail chain UUID filter. |
| `chain_ids` | No | Comma-separated retail chain UUID filters for selected overlay series. Use instead of `chain_id`. |
| `store_id` | No | Store UUID filter. |
| `store_ids` | No | Comma-separated store UUID filters for selected overlay series. Use instead of `store_id`. |
| `from` | No | Inclusive ISO-8601 `observedAt` lower bound. |
| `to` | No | Inclusive ISO-8601 `observedAt` upper bound. |

Unsupported or repeated query parameters return `400` so published notebooks fail closed instead of silently changing scope.

### Response

`200 OK` returns JSON:

```json
{
  "productId": "00000000-0000-0000-0000-000000000000",
  "rows": [
    {
      "observationId": "11111111-1111-1111-1111-111111111111",
      "productId": "00000000-0000-0000-0000-000000000000",
      "chainId": "22222222-2222-2222-2222-222222222222",
      "storeId": null,
      "priceType": "promotion",
      "price": 44.9,
      "regularPrice": 59.9,
      "unitPrice": 99.7778,
      "currency": "SEK",
      "quantity": 450,
      "quantityUnit": "g",
      "promotionText": "Veckokampanj",
      "promotionStartsOn": "2026-05-18",
      "promotionEndsOn": "2026-05-24",
      "memberRequired": true,
      "isAvailable": true,
      "observedAt": "2026-05-20T09:00:00.000Z",
      "validFrom": "2026-05-18T00:00:00.000Z",
      "validUntil": "2026-05-24T23:59:59.000Z",
      "confidence": 0.88,
      "retailerProductRef": "retailer-1",
      "sourceRunId": "source-run-1",
      "rawRecordId": "raw-record-1",
      "provenance": { "sourceType": "retailer_page" }
    }
  ],
  "meta": {
    "count": 1,
    "limit": 200,
    "filters": {
      "priceType": "promotion",
      "chainId": null,
      "chainIds": ["22222222-2222-2222-2222-222222222222"],
      "storeId": null,
      "storeIds": [],
      "from": null,
      "to": null
    },
    "overlay": {
      "selectionMode": "selected_overlay",
      "selectedChainIds": ["22222222-2222-2222-2222-222222222222"],
      "selectedStoreIds": [],
      "seriesCount": 1,
      "normalizedUnitField": "unitPrice",
      "missingDataPolicy": "preserve_gaps_no_interpolation",
      "confidence": { "min": 0.88, "max": 0.88, "field": "confidence" },
      "matchConfidenceDisclosure": "Rows expose persisted observation confidence; clients must keep confidence visible when overlaying selected chains or stores."
    },
    "source": "postgres.observations",
    "generatedAt": "2026-05-25T00:00:00.000Z",
    "license": {
      "code": "Apache-2.0",
      "data": "CC-BY-4.0",
      "attribution": "Credit GroceryView and retain each row provenance/sourceRunId when republishing."
    }
  }
}
```

### Errors

- `400` — product id is not a UUID, query parameter is unsupported, repeated, or invalid, or `from` is after `to`.
- `429` — client exceeded the public API rate limit.
- `503` — the production database is not configured for the deployment.
- `500` — query failed after validation.
