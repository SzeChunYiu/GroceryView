# Chain study comparison matrix

Status: operator summary for GroceryView model-gap triage.  
Last updated: 2026-05-25.  
Evidence source: checked-in study notes in this directory.

Legend: `yes` = source-backed finding exists; `no` = study explicitly found no evidence; `partial` = the study covers a related signal but not a complete chain-wide rule; `n/a` = outside the chain/domain scope.

| Chain / study | has_online? | has_loyalty? | has_format_variance? | has_region_pricing? | has_subscription? | has_app_coupons? | has_counter_pricing? | Study notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Willys SE | yes | yes | yes | partial | no | partial | no | [willys.md](./willys.md) documents online/in-store parity with delivery fees, Willys Plus loyalty/member prices, Willys vs Willys Hemma formats, store-scoped campaign requests, app personal-offer surface, no subscription, and no verified counter split. |
| Goodstore SE | yes | yes | no | no | no | yes | partial | [goodstore-se.md](./goodstore-se.md) documents webshop plus Stockholm shop, Goodfriends discount-code loyalty, single-store format/region, no subscription, coupon-code member rows, and café mention without counter price examples. |
| Swedish loyalty programs | partial | yes | n/a | n/a | no | yes | n/a | [loyalty-programs.md](./loyalty-programs.md) compares ICA, Coop, Willys, Hemköp, Lidl, City Gross, Apotek Hjärtat, and Apohem loyalty enrollment and app/coupon/member benefits. It is a loyalty/data-tradeoff study rather than a price-surface study. |
| Cross-chain pharmacy savings | yes | partial | n/a | no | no | no | no | [cross-chain-savings.md](./cross-chain-savings.md) uses checked-in Apohem and Apotek Hjärtat online rows for exact-EAN savings. Loyalty is only indirect through pharmacy chains; no regional, subscription, app-coupon, or counter-pricing rule is asserted. |
| Iceland fuel (N1) | yes | no | n/a | partial | no | no | n/a | [iceland-fuel.md](./iceland-fuel.md) points to N1 fuel-price evidence in the fuel domain. Region/station variance is possible at the fuel-station row level, but it is not a grocery basket pricing rule. |

## Model-gap takeaways

- **Online coverage exists for every current study**, but only Willys and Goodstore have grocery-specific online/store handling notes.
- **Loyalty/member price modeling is required** for Willys, Goodstore, and the broader Swedish loyalty-program chains. Default basket comparisons must keep public shelf rows separate from eligibility-bound member rows.
- **Format variance is currently concrete only for Willys** (`Willys` vs `Willys Hemma`). Goodstore is single-store/webshop; other studies are outside the format-split scope.
- **Region pricing is mostly a store-scoped observation problem**, not a proven rule. Willys campaign calls are store-scoped; N1 fuel rows are station/domain-specific; pharmacy exact-EAN savings should not infer regions.
- **Subscription pricing has no source-backed positive finding** in the current studies.
- **App/coupon pricing needs flags** for Goodstore discount-code rows and for loyalty programs that expose app coupons or personal offers. Willys has app/personal-offer surface evidence but no concrete public coupon-required row in the checked study.
- **Counter pricing remains a gap**. Goodstore mentions a café, but no counter price row was verified; Willys found no service-counter split.
