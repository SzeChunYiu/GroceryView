# Daily test-results dashboard

Operator page: `/admin/test-health`

The dashboard aggregates the latest run for each test type and shows:

- latest run timestamp;
- pass and fail counts;
- known flaky-test count;
- duration/time-trend bar;
- operator status (`Healthy`, `Watch flake`, `Action needed`).

The page is intended for operator-only routing. It is deliberately read-only and can later be wired to CI artifacts without changing the public route contract.
