# Security regression checks

Scope: targeted Playwright coverage for malformed search/API input.

- SQL injection: call the public price-history API with an injection-shaped product id and query values; the route must return a client error or rate-limit response, never a 500.
- XSS: load product search with a script-shaped query and assert it is rendered as text, with no script execution marker.
- CSRF: mutating POST probes are sent without trusted browser context and must not expose secrets or server errors; when protection is tightened these probes should assert 403 for every POST route.
- Rate limits: repeatedly call the price-history API from one client key until the documented 429 response appears.

Run in CI with the existing Playwright project; do not run the monorepo typecheck locally on the shared node.
