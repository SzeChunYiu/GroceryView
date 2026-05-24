# Product read load test

Run the k6 script in `scripts/load/products-10k.js` against a deployed GroceryView base URL.

```bash
BASE_URL=https://example.groceryview.test k6 run scripts/load/products-10k.js
```

Scenario: 10,000 virtual users hit `GET /api/products` for a short steady-state read test.

Pass criteria:

- p95 HTTP request duration is below 800 ms.
- HTTP request failure rate is below 0.1%.
- The endpoint returns HTTP 200 for product reads.
