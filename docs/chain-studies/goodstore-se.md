# Goodstore SE pricing quirks study

Primary source scope: `goodstore.se` pages reviewed on 2026-05-24.

## Sources

- Goodstore homepage: https://www.goodstore.se/
- Goodstore Goodfriends terms: https://www.goodstore.se/goodfriends.html
- Goodfriends membership product page: https://www.goodstore.se/medlem-goodfriends/goodfriends-medlemskap.html
- Goodstore FAQ: https://www.goodstore.se/faq-1.html
- Goodstore webshop terms: https://www.goodstore.se/villkor-info.html
- Example chilled/store-only product: https://www.goodstore.se/kylvaror/vegan-roast-beef-120g-goodstore.html

## Verifiable quirks and connector mapping

1. **Online vs in-store.** Goodstore identifies one physical store at Åsögatan 116 in Stockholm and also invites shoppers to shop online. Online parcel delivery to DHL pickup points costs 79.95 SEK and is free above 999 SEK; the terms state a 300 SEK minimum order excluding freight. Chilled goods are constrained: the FAQ says chilled products are limited to Stockholm home delivery, and the Vegan Roast Beef page is in `Kylt & Fryst (endast i butik)` and says the product is only in the Åsögatan store. The connector emits `channel: 'online'` for normal webshop rows and `channel: 'store'` for rows marked `endast i butik`; no source showed simultaneous different online and store item prices for the same SKU, so the connector does not fabricate paired online/store rows.
2. **Loyalty program.** The program is **Goodfriends**. Primary terms state a 99 SEK one-time membership fee, private-person registration requirements, 3% discount for purchases under 1,000 SEK, and about 10% above 1,000 SEK. It applies in the Åsögatan store and online. Online use requires personal discount codes entered before payment. Discounts cannot be combined with other offers or gift cards. The connector emits `is_member_price: true` Goodfriends rows for non-offer products and marks online member rows with `is_coupon_price: true` because Goodstore requires a discount code online.
3. **Format / sub-brand.** The studied sources show Goodstore as a single independent store plus webshop and café, not multiple grocery formats with separate price levels. No `format` split is codified.
4. **Region / store-cluster.** The physical store is only documented at Åsögatan 116, Stockholm. The connector uses `store_id: 'goodstore-se-stockholm-asogatan-116'` and `region: 'stockholm'` for store-channel rows.
5. **Subscription / membership-required pricing.** Goodfriends is a one-time membership, not a subscription. No `is_subscription_price: true` rows are emitted.
6. **App-only / coupon-required prices.** Goodstore documents online Goodfriends discount codes. The connector uses `is_coupon_price: true` only on online Goodfriends rows. No app-only pricing is documented.
7. **Time-of-day / close-to-close clearance.** No daily evening or close-to-close clearance pattern was found in the listed sources. No `is_clearance: true` rows are emitted.
8. **Bulk / volume tiers.** The homepage includes an offer titled `Sweet Ps Jordnötter Choklad 150g - KÖP 2 SPARA 20KR!`. The connector parses `KÖP N SPARA XKR` titles into a `multi_buy` promotion on the base row and does not combine Goodfriends rows with that offer.
9. **Service-counter vs packaged.** No service-counter price split was found in the listed sources. No `channel: 'counter'` rows are emitted.
10. **B2B / wholesale split.** Goodfriends terms state membership can only be held by private persons and not companies. No consumer connector rows are emitted for B2B pricing.
