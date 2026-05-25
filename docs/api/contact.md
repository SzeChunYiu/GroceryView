# POST /api/contact

`POST /api/contact` accepts public contact-form submissions for asynchronous handling. The runtime validates the JSON body, acknowledges accepted requests with `202 Accepted`, and never echoes the submitted message text back to the caller.

## Request

Headers:

- `Content-Type: application/json`
- Body size limit: 8 KiB

JSON body shape:

```json
{
  "name": "Ada Shopper",
  "email": "ada@example.com",
  "subject": "Optional short subject",
  "message": "A contact message with at least ten characters.",
  "consent": true,
  "source": "web"
}
```

Validation rules:

- `name`: required non-empty string, max 120 characters after trimming.
- `email`: required valid email string, max 254 characters after trimming.
- `subject`: optional non-empty string, max 160 characters after trimming.
- `message`: required string, 10 to 4000 characters after trimming.
- `consent`: required literal `true`.
- `source`: optional enum, `web` or `mobile`.
- Unknown fields are rejected.

## Success response

Status: `202 Accepted`

```json
{
  "ok": true,
  "status": "accepted",
  "requestId": "contact_0123456789abcdef",
  "receivedAt": "2026-05-20T08:00:00.000Z"
}
```

The acknowledgement intentionally omits `message`, `subject`, and the sender's email content so sensitive contact text is not echoed.

## Error responses

All runtime contact errors use this envelope:

```json
{
  "ok": false,
  "error": {
    "code": "validation_failed",
    "message": "Contact request body failed validation.",
    "details": []
  }
}
```

Documented statuses:

- `400 validation_failed` or `invalid_json` for malformed JSON or body validation failures.
- `413 payload_too_large` when the request body exceeds 8 KiB.
- `415 unsupported_media_type` when `Content-Type` is not `application/json`.
- `429 contact_rate_limited` when the client exceeds the runtime contact rate limit. The response includes `Retry-After`.
- `500 contact_internal_error` when the runtime cannot accept a valid request because of an unexpected server error.
- `503 contact_unavailable` when contact intake is temporarily disabled.
