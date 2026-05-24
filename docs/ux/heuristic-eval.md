# GroceryView heuristic evaluation — Nielsen 10

Scope: top 15 shopper/admin pages by product importance, evaluated against Nielsen's 10 usability heuristics: visibility of system status, match to the real world, user control, consistency, error prevention, recognition over recall, flexibility, minimalist design, error recovery, and help/documentation.

Legend: **OK** = no immediate issue, **Watch** = minor risk, **Ticket** = actionable product/design fix.

| Page | Strong heuristics | Findings | Ticket candidate |
| --- | --- | --- | --- |
| `/` home | Match to real world, minimalist | Dense proof points can make the primary next step compete with methodology links. | Add one persistent “start comparing prices” CTA above the fold. |
| `/products` | Recognition over recall, consistency | Product cards expose many evidence badges, but loading/empty states are not obvious from the first scan. | Add status copy for filtered/no-result states. |
| `/products/[slug]` | Visibility, help | Price history and source caveats are strong; recovery path after missing price evidence is weak. | Add “show similar products with verified prices” recovery action. |
| `/stores` | Match to real world | Store directory explains OSM provenance; country/chain filtering is buried behind navigation. | Add visible country + chain filters at top of store directory. |
| `/categories` | Recognition, consistency | Category counts are easy to scan; users must infer which categories have strong deal coverage. | Add coverage quality labels per category. |
| `/deals` | Visibility, minimalist | Deal cards explain confidence; users need clearer control to exclude member-only/sponsored rows. | Add filter toggles for member-only and sponsored surfaces. |
| `/screener` | Flexibility, user control | Sort/min-discount controls support power users; invalid query recovery is silent. | Show inline normalized-query notice when inputs are corrected. |
| `/compare` | Match, recognition | Chain comparison language is clear; table density makes mobile scanning difficult. | Add sticky row labels or card mode on narrow screens. |
| `/compare-items` | Error prevention, help | Four-item limit and missing IDs are visible; examples rely on pasted slugs. | Add product picker/search affordance before manual slug entry. |
| `/chain-index` | Visibility, consistency | Index methodology is consistently presented; system status for stale snapshots could be stronger. | Add freshness badge and stale-data warning threshold. |
| `/map` | Match, flexibility | Map context matches shopper mental model; keyboard/non-map fallback needs clearer equivalent path. | Add list/table fallback link near map controls. |
| `/list` | User control, visibility | Check-off progress is clear; multiple-list or import errors need stronger recovery copy. | Add undo/recovery affordance for bulk imports and clears. |
| `/pharmacy` | Help, error prevention | Medical/prescription boundaries are explicit; chain comparison is intentionally withheld. | Add dedicated OTC comparison path when matched EAN evidence exists. |
| `/price-reports` | Error prevention, help | Guardrails for community submissions are visible; reviewer status transitions are hard to preview. | Add review-state timeline for submitted reports. |
| `/account` | User control, error recovery | Deletion/export gates are explicit; budget/privacy actions are split across pages. | Add account hub cards for budget, privacy export, and deletion flows. |

## Cross-page themes

1. **Visibility of system status:** source freshness appears on many data-heavy pages, but stale/partial states are not presented with the same visual weight as prices.
2. **User control and freedom:** destructive or high-effort flows generally have guardrails; bulk changes need undo/recovery affordances.
3. **Recognition over recall:** routes that require slugs, EANs, or query parameters should offer picker/search alternatives.
4. **Error prevention:** claim-boundary copy is strong; inline validation and normalized-query notices should be more consistent.
5. **Help and documentation:** methodology pages exist, but page-local help should link directly to the relevant caveat or source section.

## Prioritized tickets from findings

1. Add product picker/search to `/compare-items` before manual slug entry.
2. Add freshness/stale-data badges to `/chain-index`, `/deals`, and product detail price evidence.
3. Add mobile card mode or sticky row labels to `/compare` tables.
4. Add undo/recovery affordances for `/list` bulk import and clear-check actions.
5. Add visible country + chain filters to `/stores`.
6. Add normalized-query notices to `/screener` when invalid filters are corrected.
7. Add OTC EAN comparison path from `/pharmacy` when matched pharmacy evidence exists.
8. Add member-only/sponsored filters to `/deals`.
9. Add accessible table/list fallback from `/map`.
10. Add account hub cards linking budget, privacy export, and deletion flows.
