# POST `/api/contact`

Accepts a public contact form submission and records enough information for support, partnership, retailer data, privacy, or security follow-up. The endpoint is designed for unauthenticated website forms and should avoid echoing message content back to the caller.

> Implementation note: `origin/main` does not currently expose this route in the runtime HTTP handler. This document defines the public contract the web/API implementation should follow when `POST /api/contact` is wired.

## Method and path

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/api/contact` | Public write endpoint; no bearer token required. |

Requests and responses use `application/json`. Clients should also send `Accept: application/json`.

## Parameters

The endpoint accepts a JSON request body. Unknown keys should be rejected with `400 invalid_contact_request` so clients do not believe unsupported metadata was stored.

```ts
import { z } from 'zod';

export const contactRequestSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(4000),
  topic: z.enum([
    'support',
    'retailer_data',
    'partnership',
    'privacy',
    'security',
    'press',
    'other'
  ]).default('support'),
  productId: z.string().trim().min(1).max(160).optional(),
  storeId: z.string().trim().min(1).max(160).optional(),
  pageUrl: z.string().trim().url().max(2048).optional(),
  consentToContact: z.literal(true)
}).strict();
```

### Body field semantics

| Field | Required | Description |
| --- | --- | --- |
| `name` | no | Human-readable sender name. |
| `email` | yes | Reply-to email address for follow-up. |
| `subject` | yes | Short summary used for routing and inbox previews. |
| `message` | yes | Contact message body. The server should store it with abuse scanning and avoid returning it in the success response. |
| `topic` | no | Routing category. Defaults to `support` when omitted. |
| `productId` | no | Optional product id or slug when the message is about a product listing or price. |
| `storeId` | no | Optional store id or slug when the message is about a store, retailer, or local observation. |
| `pageUrl` | no | Optional URL of the page where the user opened the contact form. |
| `consentToContact` | yes | Must be `true`; confirms GroceryView may use the submitted email address to respond to this message. |

Servers may additionally record request metadata such as IP hash, user agent, request id, spam score, and received timestamp, but clients cannot supply or override those fields.

## Response shape

Successful submissions use `202 Accepted` and return a minimal JSON acknowledgement.

```ts
type ContactResponse = {
  status: 'accepted';
  contactId: string;
  receivedAt: string;
  topic: 'support' | 'retailer_data' | 'partnership' | 'privacy' | 'security' | 'press' | 'other';
  nextStep: {
    type: 'email_response';
    message: string;
  };
};
```

The `contactId` should be safe to quote in support follow-up and logs. It does not need to reveal database ids.

## Examples

### Support request

```bash
curl -X POST 'https://api.groceryview.example/api/contact' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  --data '{
    "name": "Alex Shopper",
    "email": "alex@example.com",
    "subject": "Incorrect price on a coffee product",
    "message": "The Willys Odenplan price shown for bryggkaffe looks older than the current shelf price.",
    "topic": "retailer_data",
    "productId": "bryggkaffe-450g",
    "storeId": "willys-odenplan",
    "pageUrl": "https://groceryview.example/products/bryggkaffe-450g",
    "consentToContact": true
  }'
```

```json
{
  "status": "accepted",
  "contactId": "contact_01HYT4WM2VT7P7K0H8F5V8E8FA",
  "receivedAt": "2026-05-25T10:30:00.000Z",
  "topic": "retailer_data",
  "nextStep": {
    "type": "email_response",
    "message": "We received your message and will reply by email when a response is needed."
  }
}
```

### Privacy request

```bash
curl -X POST 'https://api.groceryview.example/api/contact' \
  -H 'Content-Type: application/json' \
  --data '{
    "email": "privacy-request@example.com",
    "subject": "Question about exported account data",
    "message": "I have a question about the data export connected to my GroceryView account.",
    "topic": "privacy",
    "consentToContact": true
  }'
```

## Error codes

| Status | Code | When it is returned | Client guidance |
| --- | --- | --- | --- |
| `400` | `invalid_contact_request` | The body is not valid JSON, required fields are missing, field values fail the Zod schema, or unknown keys are present. | Show inline validation errors and let the user correct the form. |
| `413` | `contact_payload_too_large` | The request body exceeds the accepted form payload size. | Ask the user to shorten the message or send attachments through a later support reply. |
| `415` | `unsupported_media_type` | The request is not JSON. | Retry with `Content-Type: application/json`. |
| `429` | `rate_limited` | The caller exceeded the public contact-form quota. | Back off and retry after the `Retry-After` header. |
| `500` | `contact_submission_failed` | The contact record could not be persisted or queued. | Retry later; the server should log a sanitized diagnostic. |
| `503` | `contact_service_unavailable` | The backing inbox, mail provider, or queue is intentionally unavailable. | Show a temporary failure state and invite the user to retry later. |

Error responses use JSON:

```json
{
  "error": "invalid_contact_request",
  "message": "email must be a valid email address",
  "details": [
    { "path": ["email"], "message": "Invalid email" }
  ]
}
```

## Rate limit

- Public unauthenticated clients: `5` accepted submissions per hour per IP hash.
- Burst protection: `1` submission per minute per IP hash and email pair.
- Security and privacy topics may still be accepted after the hourly quota when a server-side abuse check marks the message as low risk.
- Responses should include `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After` on `429`.
- Successful responses should use `Cache-Control: no-store` because they acknowledge user-submitted content.

## Change history

| Date | Change |
| --- | --- |
| 2026-05-25 | Initial contract documentation for `POST /api/contact`, including method/path, Zod body schema, response shape, examples, error codes, rate limit, and implementation status. |
