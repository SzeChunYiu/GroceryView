# Pressbyrån SE pricing quirks

Study date: 2026-05-25. Sources were limited to `pressbyran.se` and the linked Pressbyrån magazine webshop.

## Source-backed findings

| Topic requested | Verifiable finding | Connector handling |
| --- | --- | --- |
| Online vs in-store | Pressbyrån says it has physical stores and an online shop for ordering newspapers/magazines. The reviewed magazine-webshop page lists subscription and single-issue online prices plus shipping from 26 kr, but the reviewed sources did not publish a same-SKU in-store comparison price. A separate glass campaign says the half-price offer applies in all stores nationwide and also through Wolt, Foodora, and Uber Eats near about 135 delivery-enabled stores during the campaign. | Magazine rows use `channel: 'online'` and `format: 'magazine_webshop'`. The glass campaign emits separate `store` and `delivery` promotion rows because the source explicitly lists both channels for the same 50% campaign. No online/store price-delta rows are synthesized. |
| Loyalty program | Pressbyrån's customer club is `Pressbyrån Kompis`. Membership is created by downloading the Pressbyrån app and creating an account; the FAQ says users must be at least 16. The app FAQ says purchases of at least 15 kr earn stamps, limited to 4 stamps per day and 1 per 30 minutes, and every 5 stamps gives a reward redeemable as a discount or free coupon. `Bästis` gives more reward choices after 15 stamps in 3 months. | The connector has a source-backed `Pressbyrån Kompis` member/coupon promotion row for Kompisfika and keeps generic magazine rows non-member. |
| Format / sub-brand | Pressbyrån describes the chain as a franchise concept with about 300 stores in Sweden. It also states Pressbyrån and 7-Eleven make up Reitan Convenience Sweden AB. The reviewed sources did not publish Pressbyrån sub-brand price levels comparable to ICA Maxi/Nära. | Store-promotion rows use `format: 'pressbyran'`; magazine-webshop rows use `format: 'magazine_webshop'`. No unverified sub-brand price tiers are added. |
| Region / store-cluster | The reviewed sources state Pressbyrån has stores across Sweden and the glass campaign applies in all stores nationwide. They did not publish regional price differences. | Rows keep `region` and `store_id` null unless a future source includes store-specific evidence. |
| Subscription / membership-required pricing | The magazine webshop lists subscription purchase options, for example Allas with `Tillsvidareprenumeration`, `Helår`, `Halvår`, and `Kvartal` prices, plus a separate single-issue price. These are subscription products, not Pressbyrån Kompis-only prices. | Magazine subscription options set `is_subscription_price: true`; single-issue rows set it false. |
| App-only / coupon-required prices | The app FAQ says rewards are redeemed as app coupons and scanned in store. It gives a concrete current `Kompisfika` example: Kompis/Bästis members get 50% off a small hot drink plus any pastry on Tuesdays 15:00-16:00 by scanning the personal QR code; it cannot be combined with other offers. | `pressbyranSeKompisFikaPromotionRow` sets `is_member_price: true`, `is_coupon_price: true`, `membershipProgram: 'Pressbyrån Kompis'`, `discountPercent: 50`, and the Tuesday schedule. |
| Time-of-day or close-to-close clearance | The reviewed pages did not verify an evening, late-store, short-date, or close-to-close clearance price rule. | Rows set `is_clearance: false`. |
| Bulk / volume pricing tiers | The glass campaign allows customers to pre-order large quantities and whole boxes, but the reviewed page did not publish a `buy N for price` or `price per item when buying N+` tier. | `multi_buy` remains null. |
| Service-counter vs packaged | The reviewed pages describe convenience food, coffee/fika, and workplace fridges; they did not publish separate counter vs packaged prices for the same item. | No counter/packaged channel split is emitted. |
| B2B / wholesale split | Pressbyrån publishes `Företagsbeställning` for workplace breakfast/lunch/fika requests and `Pressbyrån @work` workplace fridges that are filled by the nearest Pressbyrån store and unlocked by app after payment. The reviewed B2B pages did not publish different B2B/wholesale rates. | B2B remains documented only; no consumer price row is emitted without a public price example. |

## Reviewed examples

- Pressbyrån overview: states physical stores plus an online shop for newspapers/magazines; says app offers can be used in store; says companies can order Pressbyrån offers as physical cards/coupons or digital coupons. Source: https://www.pressbyran.se/handla-hos-oss/
- Organization page: describes Pressbyrån as a franchise chain with around 300 stores in Sweden and says Pressbyrån together with 7-Eleven forms Reitan Convenience Sweden AB. Source: https://www.pressbyran.se/om-pressbyran/vision/
- Pressbyrån Kompis FAQ: documents 16+ account creation, 15 kr minimum stamp-earning purchase, 4 stamps/day, 1 stamp/30 minutes, 5 stamps per reward, Kompis/Bästis reward choice counts, app coupon scanning, and Kompisfika at 50% off on Tuesdays 15:00-16:00. Source: https://www.pressbyran.se/handla-hos-oss/pressbyransapp/
- Membership terms: documents that Pressbyrån Kompis is provided by Reitan Convenience Sweden AB and that members can receive discounts, member offers, stamp rewards, partner offers, referral offers, games, and contests. Source: https://www.pressbyran.se/medlemsvillkor/
- Glass campaign: documents half price on all glass in all stores nationwide, an example where a 20 kr glass becomes 10 kr, pre-ordering whole boxes, and delivery through Wolt, Foodora, and Uber Eats near about 135 stores during the campaign. Source: https://www.pressbyran.se/handla-hos-oss/ata/glass-godis/halva-priset-pa-all-glass/
- Magazine webshop example: Allas showed subscription rows (`Tillsvidareprenumeration`, `Helår`, `Halvår`, `Kvartal`), a `Lösnummer` price, activation after 14 days for subscriptions, shipping from 26 kr, and delivery only within Sweden. Source: https://webshop.pressbyran.se/sv/familj/ovrigt-familj/allas
- Pressbyrån @work: workplace fridges are placed at a workplace, stocked by the nearest Pressbyrån store, customized to the workplace, available 24/7, and unlocked digitally via app after payment. No public item prices were listed. Source: https://www.pressbyran.se/pressbyran-work/
- Företagsbeställning: companies can request breakfast, lunch, and fika orders by email/phone and receive confirmation; no public item prices were listed. Source: https://www.pressbyran.se/handla-hos-oss/foretagsbestallningar/foretagsbestallning/

## Not codified because not verified from the listed sources

- Same-SKU online vs physical-store price deltas for magazines, food, coffee, or convenience items.
- Regional or store-cluster price differences.
- Pressbyrån sub-brand price levels.
- Daily clearance, short-date, or close-to-close discounts.
- Explicit multi-buy tiers such as `buy N for X kr`.
- Service-counter versus packaged price splits.
- Public B2B/wholesale rates for restaurants, cafes, or workplaces.
