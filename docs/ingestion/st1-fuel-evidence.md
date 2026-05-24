# St1 Fuel Price Evidence

- Source URL: https://st1.se/foretag/listpris
- Probe date: 2026-05-23
- HTTP result: 200, public HTML, no login/captcha/403 observed.
- Connector: `packages/ingestion/src/connectors/st1-fuel.ts`
- Domain: `fuel`
- Unit: SEK per litre
- Source kind: `operator`

The public page exposed `Listpriser gällande från 23 maj 2026`. The connector emits one immutable fuel observation for each listed grade:

| Grade | Source label | SEK/litre |
|---|---:|---:|
| 98 | Bensin 98 | 20.19 |
| 95 | Bensin 95 | 18.89 |
| E85 | E85 | 15.84 |
| diesel | Diesel | 21.34 |
| HVO100 | HVO100 | 29.74 |

These rows are operator list-price observations, not estimated prices and not station-specific pump rows. If a future probe returns 401/403/407/429 or an authentication/captcha wall, log the source in `codex-tasks/ingestion-blockers.txt` and hand the source back for reassignment instead of fabricating fallback prices.
