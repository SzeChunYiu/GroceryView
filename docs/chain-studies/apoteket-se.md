# Apoteket.se pricing quirks (SE)

Primary source scope: apoteket.se pages and terms reviewed on 2026-05-25.

## Verified quirks

### Online vs in-store prices

Apoteket exposes separate web and store prices on product pages. Examples:

- `Apoteket Aloe Vera Gel, 200 ml` shows `Webbpris` 59 kr and `Butikspris: 89 kr`.
- `Apoteket Baby 2-i-1 rengöring, 200 ml` shows an online campaign price 29,25 kr, ordinary price 39 kr, and `Butikspris: 39 kr`.
- `Apoteket Fluorskölj Mild mint, 500 ml` shows `Webbpris` 49 kr and `Butikspris: 59 kr`.

Connector impact: when a product payload contains both a web/current price and a store price, emit separate rows with `channel: 'online'` and `channel: 'store'`.

### Loyalty program and member-only campaigns

Apoteket's customer club is `Apoteket+`. The membership terms say membership is free, requires age 16+, a valid email address, and a mobile number; membership is registered to a personal identity number. The customer-club page describes bonus levels (`+`, `++`, `+++`), bonus discount rates of 2%, 2.2%, and 2.3%, personal offers, member prices, and a senior benefit: members aged 65+ get 5% off purchases every day.

The `Medlemsdagar` campaign page documents member-only discounts by channel: online 13-16 April with code `MEDLEM` at 15% over 300 kr, 20% over 500 kr, and 25% over 700 kr; store 13-15 April with 25% off when buying at least three items. The offer excludes prescription medicines, OTC medicines, gift cards, and services.

Connector impact: payloads that identify a price as member-only or customer-club-only should emit `is_member_price: true`. Payloads that require a code/coupon, such as `MEDLEM`, should emit `is_coupon_price: true`.

### Bulk / volume promotions

Apoteket publishes volume mechanics on campaign and product pages, including `2 st för 49 kr online`, `25% vid köp av 2 online`, and `3 för 2`. The Korres campaign page is one example of `25% vid köp av 2`, while the home page and campaign navigation include `Apoteket Vätskeersättning ... 2 st för 49 kr online` and `DeoDoc 3 för 2`.

Connector impact: payloads that expose these promotion labels should preserve the label in a `multi_buy` promotion field.

## Not verified from apoteket.se in this study

- Format or sub-brand price levels: no separate Apoteket store formats were verified.
- Region or store-cluster price differences: no region-specific prices were verified beyond the generic `Butikspris` field and selected-store stock prompts.
- Paid subscription pricing: no subscription that unlocks consumer product prices was verified.
- Daily time-of-day or close-to-close clearance: no recurring evening clearance pattern was verified.
- Service-counter vs packaged prices: not applicable to the verified Apoteket assortment pages.
- B2B / wholesale split: Apoteket has healthcare/company pages, but this consumer connector should not emit B2B rows without mixed consumer inventory evidence.
