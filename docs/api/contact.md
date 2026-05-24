# Contact API

## Summary

`POST /api/contact` accepts a short support, partnership, or data-correction message from the web app contact form and queues it for the operations inbox. The endpoint is intentionally write-only: clients receive a stable submission id, but the API does not expose stored message contents or inbox state.

## Method and path

| Method | Path | Auth | Content type |
| --- | --- | --- | --- |
| `POST` | `/api/contact` | Public | `application/json` |

## Request parameters

The request body is JSON and should match the following Zod contract:

```ts
import { z } from 'zod';

export const contactRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(4000),
  reason: z
    .enum(['support', 'price_correction', 'retailer_partnership', 'privacy', 'security', 'other'])
    .default('other'),
  locale: z.enum(['sv-SE', 'en-SE', 'en']).optional(),
  pageUrl: z.string().trim().url().max(2048).optional(),
  productId: z.string().trim().min(1).max(128).optional(),
  storeId: z.string().trim().min(1).max(128).optional(),
  consentToContact: z.boolean()
});
```

### Field notes

| Field | Required | Description |
| --- | --- | --- |
| `name` | Yes | Sender display name. Store the trimmed value only. |
| `email` | Yes | Reply-to address. Used only for responding to the inquiry. |
| `subject` | Yes | Short inbox subject line. |
| `message` | Yes | Free-form message body. Do not include payment details or government identifiers. |
| `reason` | No | Routing hint for the operations inbox; defaults to `other`. |
| `locale` | No | UI locale used when the message was submitted. |
| `pageUrl` | No | Page where the contact form was opened, useful for bug reports. |
| `productId` | No | Product context for price or product-data corrections. |
| `storeId` | No | Store context for price or store-data corrections. |
| `consentToContact` | Yes | Must be `true` when the sender expects a reply. |

## Response shape

Successful requests return `202 Accepted` because delivery to the inbox may be asynchronous.

```ts
export const contactResponseSchema = z.object({
  id: z.string().min(1),
  status: z.literal('queued'),
  receivedAt: z.string().datetime({ offset: true }),
  reason: contactRequestSchema.shape.reason,
  message: z.string()
});
```

Example response:

```json
{
  "id": "contact_01JZ4H6K7R8N9P0Q1S2T3V4W5X",
  "status": "queued",
  "receivedAt": "2026-05-24T16:30:00.000Z",
  "reason": "price_correction",
  "message": "Thanks — we received your message."
}
```

## Error codes

All error responses use the shared error envelope:

```ts
export const contactErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fieldErrors: z.record(z.array(z.string())).optional(),
    retryAfterSeconds: z.number().int().positive().optional()
  })
});
```

| Status | Code | When it is returned | Client behavior |
| --- | --- | --- | --- |
| `400` | `invalid_json` | Body is missing, empty, or not valid JSON. | Re-submit JSON with `Content-Type: application/json`. |
| `422` | `validation_failed` | Body parses but fails the Zod schema. | Show field-level validation messages and let the user edit. |
| `429` | `rate_limited` | Sender exceeds the contact submission budget. | Wait for `Retry-After` or `retryAfterSeconds` before retrying. |
| `500` | `contact_queue_failed` | Message could not be queued due to a server-side dependency failure. | Show a generic retry message; do not clear the form. |

## Rate limit

`POST /api/contact` is public and must be guarded before any inbox or email delivery side effects occur.

- Limit: 5 accepted submissions per email address per rolling hour.
- Secondary limit: 20 submissions per source IP per rolling hour.
- Response header: `Retry-After: <seconds>` on `429` responses.
- Failed validation attempts count toward abuse protection but should not enqueue inbox messages.

## Examples

### Price correction

```bash
curl -X POST 'https://groceryview.example/api/contact' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Alex Shopper",
    "email": "alex@example.com",
    "subject": "Incorrect milk price",
    "message": "The displayed price for Arla Mellanmjölk at the Odenplan store is 2 kr higher than the shelf label I saw today.",
    "reason": "price_correction",
    "locale": "sv-SE",
    "pageUrl": "https://groceryview.example/products/arla-mellanmjolk",
    "productId": "arla-mellanmjolk-1l",
    "storeId": "ica-odenplan",
    "consentToContact": true
  }'
```

### General support

```json
{
  "name": "Jamie",
  "email": "jamie@example.com",
  "subject": "Can I export my list?",
  "message": "I would like to export a shared household shopping list before deleting my account. Where can I do that?",
  "reason": "support",
  "locale": "en-SE",
  "consentToContact": true
}
```

## Change history

| Date | Change |
| --- | --- |
| 2026-05-24 | Initial public contract for `POST /api/contact`, including request validation, response envelope, errors, rate limit, and examples. |
