# Chain studies comparison

Operator view of the chain-study model gaps. `yes` means the study has explicit evidence for the capability; `no` means the study indicates the model does not need that dimension yet; `unknown` means the data model should keep a gap open until a chain-specific study proves it.

| Chain | has_online? | has_loyalty? | has_format_variance? | has_region_pricing? | has_subscription? | has_app_coupons? | has_counter_pricing? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Willys | yes | yes | yes | unknown | no | yes | unknown |
| Hemköp | yes | yes | yes | unknown | no | yes | unknown |
| ICA | yes | yes | yes | yes | no | yes | yes |
| Coop | yes | yes | yes | unknown | no | yes | yes |
| Lidl | yes | yes | yes | unknown | no | yes | unknown |
| City Gross | yes | yes | yes | unknown | no | yes | yes |
| Mathem | yes | yes | no | yes | yes | yes | no |

## Gap summary

- `has_region_pricing?` remains the widest store-model gap: only ICA and Mathem are marked yes because their storefronts can expose branch or delivery-zone dependent prices.
- `has_counter_pricing?` is only yes where deli, meat, fish, or service-counter rows can diverge from packaged-item pricing.
- `has_subscription?` is currently isolated to Mathem-style delivery/subscription mechanics; brick-and-mortar chains stay no until a study proves paid recurring price benefits.
- `unknown` cells should block automatic schema deletion: keep the dimension until the corresponding chain study closes it as yes or no.
