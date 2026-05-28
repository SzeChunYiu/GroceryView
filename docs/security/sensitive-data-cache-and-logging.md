# Sensitive data cache and logging contracts

GroceryView treats account-scoped routes, preferences, watchlists, alerts,
receipts, scanner data, and household data as private user data. The ASVS L2
contract is:

- Browser and edge caches must not store account-scoped routes. The web cache
  policy classifies `/account`, `/settings`, `/watchlist`, scanner routes, and
  user-specific API routes as `private-account` and emits `private, no-store`.
- Mobile persisted query caches are partitioned by user, purged on sign-out,
  capped to a bounded age, and must redact receipt images, auth tokens, and
  precise location before persistence.
- Application request logs must use a structured allowlist. The API logger
  records method, path without query string, status, duration, request id, and
  timestamp only; request bodies, headers, query strings, account identifiers,
  receipt contents, watchlist targets, and tokens are not log fields.

This document is evidence for the shared cache and logging contract; the
enforcement remains in the code and tests referenced by the ASVS L2 checklist.
