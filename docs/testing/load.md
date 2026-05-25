# Load testing `/api/products`

This repository ships a k6 scenario for the release-readiness load gate in factory ticket #1910. It drives 10,000 concurrent virtual users against the public product search API and fails unless the product-read path stays below the agreed latency and error budgets.

## Script

- `scripts/load/products-api-10k.js`
- Target endpoint: `GET /api/products?q=<PRODUCT_QUERY>`
- Default query: `milk`
- Default load: `10000` virtual users for `5m`

## Pass criteria

The k6 thresholds are encoded in the script so local and CI-style runs fail closed:

- `http_req_duration{endpoint:products}: p(95)<800` — p95 latency under 800 ms.
- `http_req_failed{endpoint:products}: rate<0.001` — HTTP/network error rate under 0.1%.
- `checks{endpoint:products}: rate>0.999` — JSON shape and status checks stay above 99.9%.

## Running the test

Install k6, then point the script at a production-like deployment with the product search database configured. Do not run the 10k VU profile against a shared developer laptop unless you intentionally want a local stress test.

```bash
BASE_URL=https://grocery-web-mu.vercel.app \
PRODUCT_QUERY=milk \
k6 run scripts/load/products-api-10k.js
```

Useful overrides:

```bash
# Small smoke run before the full 10k profile.
BASE_URL=http://localhost:3000 VUS=25 DURATION=30s k6 run scripts/load/products-api-10k.js

# Full gate with an alternate realistic query.
BASE_URL=https://grocery-web-mu.vercel.app PRODUCT_QUERY=pasta VUS=10000 DURATION=5m k6 run scripts/load/products-api-10k.js
```

## Reading results

A passing run must show all thresholds as successful. Treat any of these as release blockers until the product API, database pool, or hosting capacity is remediated:

- p95 request duration at or above 800 ms.
- `http_req_failed` at or above `0.001`.
- failed status, content-type, or payload-shape checks.

Capture the final k6 summary in the release artifact or PR comment when this load gate is used for a release candidate.
