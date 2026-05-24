# Iceland chain study

Last updated: 2026-05-24

This study tracks Icelandic data-source candidates for GroceryView's Nordic expansion. Connector-specific details live in `docs/connectors/`.

## Connector candidates

| Chain | Connector doc | Role | Current status |
| --- | --- | --- | --- |
| N1 | [`n1-is`](../connectors/n1-is.md) | Fuel/service-station convenience coverage; useful for travel baskets, station services, fuel observations, and limited food/refreshment metadata. | Documented source surfaces and fail-closed rules; no product-level grocery rows unless a stable source-backed catalogue appears. |

## Notes

- Iceland remains a useful proof-of-concept market because coverage gaps are visible and station/convenience chains matter for travellers outside Reykjavík.
- Treat fuel, convenience food, and supermarket grocery rows as separate evidence types so price comparison does not mix incompatible baskets.
- Any connector promoted from study status needs source-backed fixtures, explicit freshness metadata, and low-confidence routing for ambiguous rows.
