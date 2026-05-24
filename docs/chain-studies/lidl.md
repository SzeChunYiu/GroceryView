# Lidl Sweden pricing quirks

Last checked: 2026-05-24. Primary sources used: `lidl.se`, Lidl Plus app/coupon pages on `lidl.se`, and Lidl weekly-offer/flyer week pages on `lidl.se`.

## Codified connector fields

| Field | Connector behavior | Source-backed reason |
| --- | --- | --- |
| `channel: 'store'` | Public Lidl SE offer rows are emitted as store-channel rows. | `https://www.lidl.se/` presents store/flyer offers and store lookup, not a Swedish grocery e-commerce checkout. Lidl Plus discounts are redeemed by scanning the Lidl Plus card at checkout. |
| `format: 'standard'` | Public Lidl SE offer rows use the single standard format. | The Swedish site exposes Lidl stores under one Lidl banner/store locator (`https://www.lidl.se/s/sv-SE/butiker/`) with no public Maxi/Nära-style sub-format split. |
| `is_member_price: true` | Set when embedded offer payloads contain `currentLidlPlusPrice`. | Lidl documents weekly Lidl Plus offers for selected favourites and states use requires Lidl app download and active Lidl Plus membership: `https://www.lidl.se/c/lidl-plus-erbjudanden/s10017715`. |
| `is_coupon_price: true` | Set for the same `currentLidlPlusPrice` rows. | Lidl Plus coupon page says coupons are in the Lidl app, must be activated, and are redeemed automatically when the Lidl Plus card is scanned: `https://www.lidl.se/c/lidl-plus-kuponger/s10017713`. |

## Required quirk checklist

1. **Online vs in-store** — No separate Swedish online grocery checkout price was found on `lidl.se`. The official Swedish homepage routes shoppers to weekly offers, flyers, and store lookup. Connector emits the verified public offer rows as `channel: 'store'` only.
2. **Loyalty program** — Program name: Lidl Plus. Requirement: download/use the Lidl app and have active Lidl Plus membership. Scope: selected weekly offers/coupons, not every item. Typical discount varies by offer; the connector stores the actual observed Lidl Plus price and old price when embedded in the offer payload. Rows with `currentLidlPlusPrice` emit `is_member_price:true`.
3. **Format / sub-brand** — No public Swedish format split was found on `lidl.se`; connector emits `format:'standard'`.
4. **Region / store-cluster** — Lidl offer payloads include region identifiers (`regions` / `regionsPrices`). The connector already emits `regions` and fans rows across discovered stores with `storeId`, so any regional Lidl source split remains attached to store materialization.
5. **Subscription / membership-required pricing** — Lidl Plus is an app/customer program in the checked public pages, not a paid subscription price tier. No `is_subscription_price` field is emitted.
6. **App-only / coupon-required prices** — Lidl Plus coupons require the Lidl app, activation, and Lidl Plus card scan. Connector emits `is_coupon_price:true` for `currentLidlPlusPrice` rows.
7. **Time-of-day or close-to-close clearance** — No official daily evening/close-to-close clearance program was found in the checked Lidl SE sources. No `is_clearance` field is emitted.
8. **Bulk / volume pricing tiers** — The weekly pages include an `XXL` campaign category, but the checked sources did not provide a concrete "buy N for price X" example in the connector fixture. No `multi_buy` row is emitted until a concrete flyer payload exposes one.
9. **Service-counter vs packaged** — No service-counter price source was found on `lidl.se`; public offer rows are packaged/store offer rows only.
10. **B2B / wholesale split** — No restaurant/cafe wholesale enrollment or B2B price list was found in the checked Lidl SE sources. Consumer connector remains store-offer only.

## Source URLs

- Lidl Sweden homepage / navigation: https://www.lidl.se/
- Lidl store locator: https://www.lidl.se/s/sv-SE/butiker/
- Lidl Plus offers: https://www.lidl.se/c/lidl-plus-erbjudanden/s10017715
- Lidl Plus coupons: https://www.lidl.se/c/lidl-plus-kuponger/s10017713
- Weekly offer index/flyer weeks: https://www.lidl.se/c/lidl-plus-erbjudanden/
- Example Monday-Sunday offer week: https://www.lidl.se/c/mandag-soendag/a10094783
- Example XXL offer week: https://www.lidl.se/c/xxl/a10094174
