# Lidl pricing quirks (SE)

Primary source scope: lidl.se, Lidl Plus pages, and Lidl offer payload fields reviewed on 2026-05-25.

## Verified quirks

### Store/flyer channel rather than online grocery checkout

Lidl Sweden's public offer pages and product snippets describe items as available `I butik` for a date range. The connector reads Lidl flyer/offer pages and store directory pages, not an online grocery checkout price.

Connector impact: Lidl offer rows emit `channel: 'store'`. No online row is emitted without a verified online grocery price.

### Lidl Plus member prices and app coupons

Lidl describes Lidl Plus as a digital customer card in the Lidl app for discounts, bonuses, tailored offers, digital receipts, and weekly coupons. Lidl Plus coupon and offer pages state that use requires downloading the Lidl app and active Lidl Plus membership, and that Lidl Plus coupons/offers are only valid for Lidl Plus customers. Coupon redemption requires activating coupons in the app and scanning the Lidl Plus card at checkout. Product examples show `Med Lidl Plus`, `Kupong`, and a lower Lidl Plus price.

Connector impact: offers with Lidl Plus prices emit `is_member_price: true`; offers whose promotion text contains coupon wording emit `is_coupon_price: true`.

### Weekly flyer windows and regions

Lidl's public offer navigation is grouped by week and campaign windows such as `Måndag-söndag`, `Torsdag-söndag`, `Superklipp`, and `Lidl Plus-erbjudanden`. Lidl offer payloads expose `startDate`, `endDate`, and regional price maps.

Connector impact: preserve `validFrom`, `validTo`, and `regions` on offer rows.

### Bulk / volume promotions

Lidl product examples include volume mechanics such as `KUPONG 2 FÖR: 48:-` for Vispgrädde. These are store-offer mechanics, not separate product channels.

Connector impact: promotion text containing explicit volume mechanics is copied to `multi_buy`.

### Clearance / short-window promotions

Lidl's weekly navigation includes `Superklipp` windows, and Lidl pages use app/flyer promotions for short-lived in-store discounts. No durable daily close-to-close pattern was verified, but short-window `Superklipp`/`klipp` labels are clearance-like offer markers.

Connector impact: offers from `superklipp` pages or labels with `klipp`, `svinnsmart`, or `kort datum` emit `is_clearance: true`.

## Not verified from lidl.se in this study

- Online grocery prices: no online order price was verified.
- Format or sub-brand price levels: no separate Lidl store formats were verified.
- Store-cluster prices beyond Lidl region payloads: region keys are preserved, but no named urban/rural price rule was verified.
- Paid subscription pricing: Lidl Plus is an app membership/customer-card program, not a paid subscription price in the reviewed sources.
- Service-counter vs packaged prices: no counter/package split was verified.
- B2B / wholesale split: no mixed consumer/B2B product prices were verified.
