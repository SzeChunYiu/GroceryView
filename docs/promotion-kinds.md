# Promotion kinds

Promotion rows use a stable `kind` plus a `terms` JSON object. `effective_unit_price` is the normalized price GroceryView can compare after applying only source-backed mechanics; when the mechanic is not a direct discount, it stays equal to the observed unit price and the UI surfaces the benefit separately.

| kind | Required `terms` shape | `effective_unit_price` rule | Connector-log example |
|---|---|---|---|
| `member` | `{ member_required: true, member_price, regular_price? }` | Use `member_price` only on loyalty-enabled surfaces; otherwise use the regular observed price. | ICA / Willys member-only rows that require a card. |
| `multi_buy` | `{ qty, price, unit_eff }` | `price / qty`, normalized to `unit_eff` when package units are comparable. | Goodstore `buy_2_save_20_sek` style multi-buy evidence. |
| `x_for_y` | `{ n, price, n_eligible_skus }` | `price / n`; require `n_eligible_skus >= n` before applying across a mixed set. | Flyer copy like `3 för 2` across eligible SKUs. |
| `percent_off` | `{ percent_off, base_price }` | `base_price * (1 - percent_off / 100)`. | Campaign copy such as `20% rabatt`. |
| `fixed_off` | `{ amount_off, base_price }` | `max(base_price - amount_off, 0)`. | Coupon or campaign copy such as `10 kr rabatt`. |
| `bogo` | `{ buy_n, get_m, nth_free? }` | If `nth_free`, divide paid units by `buy_n + get_m`; otherwise use explicit bundle total when present. | `Köp 2 få 1` / `var tredje gratis`. |
| `bundle` | `{ sku_list, bundle_price }` | `bundle_price / sku_list.length` only when all bundle SKUs are present in the row set. | Meal or household bundles with named SKUs. |
| `threshold` | `{ min_spend, discount }` | Do not lower a single item by default; apply at basket level once `min_spend` is reached. | `Handla för 300 kr få 30 kr rabatt`. |
| `loyalty_points` | `{ point_multiplier }` | No direct price discount; keep observed unit price and display the point multiplier. | `10x poäng`, `20% bonuspoäng`. |
| `surplus` | `{ pct_off, expires_at }` | Use the explicit surplus bag price; `pct_off` is evidence/display only. | Surplus parser rows with `bag_price`, `original_price`, and expiry. |
| `coupon` | `{ code_required, discount?, coupon_code? }` | Apply only when a shopper has the required code; otherwise keep shelf price. | App-only or clipped coupon offers. |
| `flyer` | `{ week_of, valid_from?, valid_until? }` | Use the flyer price for the validity window, never outside it. | ICA e-magin / store offer pages and direct flyer connectors. |

## Guardrails

- Never convert loyalty points into a cash discount unless a separate, explicit redemption value is present.
- Do not spread threshold or bundle discounts over unrelated products; keep them basket-scoped until all terms are satisfied.
- Prefer the source's explicit unit price when it is present and internally consistent with package size.
- Keep raw promotion text and source URL with every row so reviewers can audit ambiguous mechanics.
- If a parser cannot prove the required `terms` fields, emit the observed price without a promotion `kind` instead of guessing.
