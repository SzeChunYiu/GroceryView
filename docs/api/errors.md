# POST /api/errors

Client-side error reporter for the GroceryView web and mobile clients. The endpoint accepts sanitized runtime error events, stores or forwards them to the configured observability sink, and returns a short acknowledgement. It is intentionally write-only: clients cannot read submitted reports from this API.

## Method and path

| Method | Path | Authentication | Content type |
| --- | --- | --- | --- |
| `POST` | `/api/errors` | Optional bearer session; anonymous browser reports are accepted with stricter limits | `application/json` |

## Request parameters

No query-string parameters are supported. All input is supplied as a JSON request body validated with the following Zod schema:

```ts
import { z } from 'zod';

export const clientErrorReportSchema = z.object({
  app: z.enum(['web', 'mobile']),
  level: z.enum(['error', 'warning']).default('error'),
  message: z.string().trim().min(1).max(2000),
  name: z.string().trim().max(200).optional(),
  stack: z.string().max(12000).optional(),
  componentStack: z.string().max(12000).optional(),
  route: z.string().trim().min(1).max(512).regex(/^\//),
  url: z.string().url().max(2048).optional(),
  release: z.string().trim().min(1).max(128),
  environment: z.enum(['development', 'preview', 'production']),
  occurredAt: z.string().datetime({ offset: true }),
  userAgent: z.string().max(512).optional(),
  requestId: z.string().trim().min(1).max(128).optional(),
  sessionIdHash: z.string().trim().min(16).max(128).optional(),
  tags: z.record(z.string().trim().min(1).max(64), z.string().trim().max(128)).default({}),
  context: z.record(z.string().trim().min(1).max(64), z.union([
    z.string().max(512),
    z.number().finite(),
    z.boolean(),
    z.null()
  ])).default({})
}).strict();
```

### Field notes

- `message`, `name`, `stack`, and `componentStack` describe the client exception. Clients must strip access tokens, cookies, payment data, and raw form values before submission.
- `route` is the application route that rendered when the error happened, for example `/products` or `/basket/current`. Use `url` only when the full URL is already safe to log.
- `release` should be the deployed Git SHA, build id, or mobile app version.
- `sessionIdHash` is optional and must be a one-way hash. Do not send bearer tokens, email addresses, or raw session ids.
- `tags` are low-cardinality dimensions such as `{ "surface": "price-card" }`; `context` is for bounded debugging facts such as `{ "storeCount": 3 }`.

## Response shape

### `202 Accepted`

The endpoint queues or persists a valid report and returns:

```json
{
  "status": "accepted",
  "reportId": "err_01HYZ4K5F2TZ8W4DB7S8GZ8P0M",
  "receivedAt": "2026-05-24T12:30:00.000Z"
}
```

`reportId` is safe to show in support copy. It is not a lookup credential and does not expose report contents.

## Error codes

| HTTP status | Code | When returned | Client behavior |
| --- | --- | --- | --- |
| `400` | `invalid_json` | Request body is not valid JSON. | Drop the event after local console logging. |
| `400` | `invalid_error_report` | JSON does not match the Zod schema, includes unsupported fields, or exceeds length limits. | Fix the client payload; do not retry unchanged. |
| `401` | `invalid_session` | A bearer token was supplied but failed verification. Anonymous reports should omit invalid tokens. | Refresh auth and retry once without sensitive state. |
| `413` | `error_report_too_large` | Body exceeds the configured request-size limit. | Trim stack/context and retry at most once. |
| `429` | `error_report_rate_limited` | The rate limit key exceeded the reporting allowance. | Back off and sample further errors locally. |
| `503` | `error_report_sink_unavailable` | The runtime has no configured sink or the sink health check is failing. | Keep user flow unblocked; retry with exponential backoff only if the app already has a background queue. |

Error responses use the common API error envelope:

```json
{
  "error": {
    "code": "invalid_error_report",
    "message": "Client error report failed validation.",
    "details": {
      "fieldErrors": {
        "message": ["Required"]
      }
    }
  }
}
```

## Rate limit

- Limit key: `sessionIdHash` when present; otherwise a hash of client IP plus `User-Agent`.
- Anonymous clients: 10 accepted reports per 10 minutes with a burst of 3 per minute.
- Authenticated clients: 30 accepted reports per 10 minutes with a burst of 10 per minute.
- The endpoint should return `429 error_report_rate_limited` with `Retry-After` seconds when the limit is exceeded.
- Clients should sample repeated errors with the same `message`, `route`, and `release` before calling the endpoint to avoid loops during outages.

## Examples

### Minimal browser report

```http
POST /api/errors HTTP/1.1
Content-Type: application/json

{
  "app": "web",
  "level": "error",
  "message": "Cannot read properties of undefined (reading 'price')",
  "name": "TypeError",
  "route": "/products",
  "release": "web-2026.05.24.1",
  "environment": "production",
  "occurredAt": "2026-05-24T12:29:58.250Z",
  "tags": {
    "surface": "product-card"
  },
  "context": {
    "productCount": 24,
    "hydrated": true
  }
}
```

### Mobile report with correlation ids

```http
POST /api/errors HTTP/1.1
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "app": "mobile",
  "level": "warning",
  "message": "Receipt OCR provider returned an empty candidate list",
  "route": "/receipt-upload",
  "release": "ios-1.8.0+142",
  "environment": "production",
  "occurredAt": "2026-05-24T12:31:10.100Z",
  "requestId": "req_01HYZ4P9VB1P2DQ1RMYDFGQFJ3",
  "sessionIdHash": "f3f4a663b0f736d46d40f0dd0f96ac5c",
  "tags": {
    "surface": "receipt-upload",
    "provider": "ocr-space"
  },
  "context": {
    "imageBytes": 482120,
    "retryCount": 1
  }
}
```

### Validation failure

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "invalid_error_report",
    "message": "Client error report failed validation.",
    "details": {
      "fieldErrors": {
        "route": ["Must start with /"]
      }
    }
  }
}
```

## Change history

| Date | Change |
| --- | --- |
| 2026-05-24 | Initial contract for `POST /api/errors`, including schema, response envelope, error codes, rate limit, and examples. |
