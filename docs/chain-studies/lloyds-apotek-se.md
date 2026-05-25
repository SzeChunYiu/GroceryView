# Lloyds Apotek SE pricing quirks

Study date: 2026-05-25. Sources were limited to `lloydsapotek.se`, which redirects to `dozapotek.se`, and current pages on that redirected DOZ Apotek site.

## Source-backed findings

| Topic requested | Verifiable finding | Connector handling |
| --- | --- | --- |
| Online vs in-store | `lloydsapotek.se` redirects to DOZ Apotek. The DOZ home page titles the service as an online and store pharmacy, links to `Hitta apotek`, and publishes web product prices and campaign prices. The reviewed pages did not publish a same-SKU online price and store price pair, so no verified online-vs-store OTC price delta was found. | Product rows are online webshop rows with `channel: 'online'` and `format: 'doz_webshop'`. The connector does not synthesize store rows without a source field for a store price. |
| Loyalty program | The DOZ header exposes `Bli medlem`, `Min sida`, and `Min bonus`, but the reviewed public pages did not expose a source-backed product-level member price, member discount percent, or member-only product row. | Rows keep `is_member_price` absent unless source product data exposes a member-price label through the shared pharmacy parser. |
| Format / sub-brand | The current source presents DOZ Apotek as the active redirected brand and publishes a store finder with individual DOZ Apotek stores. The reviewed pages did not publish separate pharmacy format price levels. | Rows use `format: 'doz_webshop'`; no additional format tier is emitted. |
| Region / store-cluster | The store finder embeds individual store records with addresses, opening hours, and coordinates, but the reviewed pages did not publish regional product price differences. | No `store_id` or region tag is emitted for online product rows unless a future source row includes a store-specific price. |
| Subscription / membership-required pricing | The reviewed pages did not publish a consumer subscription that unlocks product prices. | Rows set `is_subscription_price: false`. |
| App-only / coupon-required prices | The reviewed pages did not publish app-only or coupon-code product prices. | Rows do not set `is_coupon_price` unless source product data exposes a coupon label through the shared pharmacy parser. |
| Time-of-day or close-to-close clearance | The DOZ campaign navigation and `Kort hållbarhet` OUTLET page publish short-shelf-life outlet products with campaign price and ordinary price fields. This is a short-date clearance surface, not a time-of-day rule. | Rows parsed from the `kort-hallbarhet` outlet source set `is_clearance: true`. |
| Bulk / volume pricing tiers | The DOZ campaign navigation lists volume offers including `6 för 99:-`, `3 för 2`, and several `2 för` campaigns. The V6 campaign page is a concrete example: `2 för 50:- V6 Tuggummi Ask`; product cards show V6 products with the `V6 Ask 2 för 50 kr` promotion label. | Rows parsed from the V6 campaign source set `multi_buy: '2 för 50 kr V6 Tuggummi Ask'`; shared parser-detected multi-buy labels are preserved. |
| Service-counter vs packaged | The reviewed pharmacy pages did not publish service-counter versus packaged prices for the same item. | No `counter` or `packaged` channel is emitted. |
| B2B / wholesale split | The reviewed pages did not publish restaurant, cafe, or wholesale customer rates. | No B2B row is emitted. |

## Reviewed examples

- Lloyds redirect: `https://www.lloydsapotek.se/` redirects to `https://dozapotek.se/`.
- DOZ home page: title states `DOZ Apotek | Apotek online och i butik | DOZ Apotek`; header links include `Hitta apotek`, `Bli medlem`, `Min sida`, and `Min bonus`; delivery copy states free freight alternatives for prescription medicines and for other products above 199 kr. Source: https://dozapotek.se/
- Store finder: embeds individual DOZ Apotek store records with store names, addresses, coordinates, ordinary opening hours, special opening hours, and local store ids. Source: https://dozapotek.se/hitta-apotek
- Campaign navigation: includes percent campaigns, OUTLET, `Kort hållbarhet`, Wolt delivery links, and volume campaigns such as `6 för 99:-`, `3 för 2`, and `2 för` offers. Source: https://dozapotek.se/
- V6 multi-buy campaign: page title and breadcrumb identify `2 för 50:- V6 Tuggummi Ask`; product cards include V6 items and a `V6 Ask 2 för 50 kr` promotion label. Source: https://dozapotek.se/aktuella-kampanjer/alltid-pa-doz/2-for-50-kr-v6-ask
- Short-date outlet: page title and metadata identify `Kort hållbarhet - OUTLET`; product cards expose `Kampanjpris` and `Ord.pris`. Source: https://dozapotek.se/aktuella-kampanjer/outlet/kort-hallbarhet

## Not codified because not verified from the listed sources

- Same-SKU online versus in-store price deltas for OTC categories.
- Product-level member prices or typical member discount percentages.
- Separate sub-brand or store-format price levels.
- Regional or store-cluster product price differences.
- Subscription-unlocked product prices.
- App-only or coupon-code product prices.
- Recurring evening or close-to-close price rules.
- Service-counter versus packaged price splits.
- Public B2B or wholesale rates.
