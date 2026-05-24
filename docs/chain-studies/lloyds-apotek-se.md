# Lloyds Apotek SE / DOZ Apotek pricing quirks

Sources checked: `https://www.lloydsapotek.se/` (redirects to `https://dozapotek.se/`), `https://dozapotek.se/wellibites-extra-salt-saltlakrits-70-g-782683`, and `https://dozapotek.se/aktuella-kampanjer`.

## Findings codified in the connector

- `lloydsapotek.se` redirects to DOZ Apotek, so the connector uses DOZ URLs while retaining the Lloyds/DOZ chain id.
- Product pages expose an `Onlinepris` label and the same page exposes local pharmacy stock lookup (`Se lagerstatus i lokala apotek`). The checked product page did not expose a separate in-store price, so the connector emits the observed product/campaign price as `channel: 'online'` only.
- The campaign page exposes campaign prices next to ordinary prices, for example `Bepanthen salva, 100 g` with `Kampanjpris 103,20 kr` and `Ord.pris 129,00 kr`, `Dermix Absolut Torr ...` with `Kampanjpris 44,25 kr` and `Ord.pris 59,00 kr`, and `Canoderm, kräm 5 %, 500 gram` with `Kampanjpris 213,30 kr` and `Ord.pris 237,00 kr`. The connector emits these as campaign rows with `price`, `regularPrice`, `channel: 'online'`, and `is_campaign_price: true`.
- The campaign page exposes volume offers: `Berocca` has `3 för 2 på alla 15-pack`, `V6 Ask` has `2 för 50 kr`, `Vicks halstabletter` has `2 för 30:-`, `Gunry våtservetter` has `2 för 60:-`, and `Allevo bars` has `3 för 2`. The connector emits these as `multi_buy` rows.

## Findings not codified

1. Online vs in-store: a distinct store price was not visible in the checked source pages. Only online campaign/product prices are emitted.
2. Loyalty program: the site navigation contains `Bli medlem` and `Min bonus`, but no checked source page exposed a concrete member-only price, member discount percentage, or member scope. No `is_member_price:true` rows are emitted.
3. Format / sub-brand: no separate Lloyds/DOZ store format price levels were visible in the checked source pages. No `format` field is emitted.
4. Region / store-cluster: local pharmacy stock lookup exists, but no region-specific price was visible in the checked source pages. No `store_id` region tag is emitted.
5. Subscription / membership-required pricing: no subscription price was visible in the checked source pages. No `is_subscription_price:true` rows are emitted.
6. App-only / coupon-required prices: no app-only or coupon-required product price was visible in the checked source pages. No `is_coupon_price:true` rows are emitted.
7. Time-of-day / close-to-close clearance: no evening or close-to-close clearance price was visible in the checked source pages. No `is_clearance:true` rows are emitted.
8. Bulk / volume pricing tiers: volume offers are visible and codified as `multi_buy` rows.
9. Service-counter vs packaged: not applicable to the checked pharmacy source pages; no counter/packaged split was visible.
10. B2B / wholesale split: no consumer page showed B2B or wholesale pricing mixed into product inventory.
