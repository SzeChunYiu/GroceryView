# Security e2e test plan

Target: Playwright coverage for the web security smoke gates in `apps/web/e2e/security/`.

## Covered checks

- SQL injection payloads: send malformed query text such as `' OR 1=1--` through public search/navigation entry points and assert the app never returns a 5xx or a database/stack-trace error.
- Reflected XSS payloads: navigate with encoded `<script>`/event-handler payloads, assert the marker script is not executed, and assert raw payload text is not reflected into the DOM.
- CSRF on POST: send JSON POSTs without a CSRF token to mutating endpoints. Existing POST endpoints must reject with 400/401/403/419; 404/405 routes are treated as not-applicable in the shared smoke file.
- Rate limiting: repeatedly POST to the configured rate-limit target and assert a 429 response appears.

## Runtime configuration

The tests default to safe public paths and can be pointed at deployed routes without editing code:

- `SECURITY_SEARCH_PATH` — GET path used for SQLi/XSS query checks, default `/search`.
- `SECURITY_CSRF_POST_PATHS` — comma-separated POST paths checked for CSRF, default `/api/list/import,/api/feedback,/api/session`.
- `SECURITY_RATE_LIMIT_PATH` — POST path checked for 429 behavior, default `/api/search`.
- `SECURITY_RATE_LIMIT_ATTEMPTS` — request count for the 429 check, default `40`.

CI should set the POST paths to every mutating web route once the deployed route map is known. The smoke file fails any discovered POST endpoint that returns 2xx without a CSRF token.
