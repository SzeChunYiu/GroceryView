# Apoteksgruppen SE pricing quirks (primary-source study)

Last reviewed: 2026-05-24. Primary source URL `https://www.apoteksgruppen.se/` redirects to Kronans Apotek customer service, so codified rows use the current Kronans pages reached from that source. No claim below is based on rumours or third-party price scraping.

## Source facts

- `apoteksgruppen.se` resolves to Kronans Apotek customer service, with Kronans Apotek AB organisation number 556787-2048 and Kronans navigation, including links to Hitta apotek, Erbjudanden, Kundklubb, Köpvillkor and Medlemsvillkor. Source: https://www.apoteksgruppen.se/
- Kronans purchase terms apply to sales through `www.kronansapotek.se` and the Kronans app. In the campaign section, Kronans states that offers last while stock remains, selected products are shown in campaign text, 3-for-2 gives the cheapest product free, and prices can differ online and in store. Source: https://www.kronansapotek.se/villkor/kopvillkor/
- Kronans member terms define “Klubb Kronans Apotek”. Membership is free, personal, requires age 18, Swedish population registration and no protected identity; members get personal offers/marketing and bonus points on qualifying purchases. Source: https://www.kronansapotek.se/villkor/medlemsvillkor/
- The offers page exposes concrete public promotion mechanics including percent campaigns, “Köp 2 få …” and “3 för 2”, and a “För våra klubbmedlemmar” grouping. Source: https://www.kronansapotek.se/erbjudanden/

## Required quirks

| Quirk | Verifiable finding | Connector action |
| --- | --- | --- |
| Online vs in-store | Verified. Kronans purchase terms say prices can differ online and in store. The source does not publish a category-by-category delta table. | `buildApoteksgruppenDualChannelRows` emits separate `channel:'online'` and `channel:'store'` rows when both prices are supplied by an upstream observation. |
| Loyalty program | Verified. Klubb Kronans Apotek is free and gives personal/general offers plus bonus points on qualifying purchases. | `parseApoteksgruppenOfferText` sets `is_member_price:true` only when source text contains member/club wording such as “För våra klubbmedlemmar”. |
| Format / sub-brand | Not verified from current Apoteksgruppen/Kronans pages. | Emit `format:null`; do not invent ICA/Coop-style formats. |
| Region / store-cluster | Not verified from current source pages as a pricing rule. | Keep optional `store_id` and `region` pass-through only when an upstream store observation supplies them; no synthetic region tagging. |
| Subscription pricing | Not verified. Klubb membership is free; no paid subscription price tier was found in the reviewed pages. | Emit `is_subscription_price:false`. |
| App-only / coupon-required | Not verified in the reviewed source pages. | Emit `is_coupon_price:false` unless future source text explicitly says coupon/app-only. |
| Close-to-close clearance | Not verified. | Emit `is_clearance:false`. |
| Bulk / volume pricing | Verified. Offers page lists “3 för 2” and “Köp 2 få …” promotion forms. | `parseApoteksgruppenOfferText` populates `multi_buy` for “3 för 2” and “Köp N få …”. |
| Service-counter vs packaged | Not verified for this pharmacy chain. | No `counter` channel emitted. |
| B2B / wholesale split | The reviewed consumer pages link to a Företagskund area, but no consumer price row shares mixed inventory in the source evidence. | Out of scope for consumer connector. |

## Connector guardrails

- Keep `successorChainId:'kronans_apotek'` to make the Apoteksgruppen redirect explicit.
- Do not emit member, coupon, subscription, clearance, format or region fields unless the source text justifies them.
- When both online and store prices are observed, emit both rows rather than overwriting one with the other.
