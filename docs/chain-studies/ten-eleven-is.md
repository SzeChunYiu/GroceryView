# 10-11 Iceland pricing-quirk study

Primary source checked: https://www.10-11.is/ (retrieved 2026-05-24).

## Source coverage

The 10-11 site is a Wix homepage for the chain. The ticket note calls the chain convenience/high-markup, but the checked source does not publish comparable prices, so markup level is not codified. It lists store locations and opening hours, but it does **not** publish a product catalogue, online ordering flow, item prices, loyalty prices, coupons, clearance prices, multi-buy offers, counter prices, or B2B/wholesale price terms on the checked page.

Visible store evidence on the checked source:

| Store/address text on source | Verifiable hours text | Connector coding |
| --- | --- | --- |
| Laugavegur á móti Hlemmi | `Verslun 24/7` | `channel: 'store'`, `format: 'convenience'`, `region: 'capital-region'` |
| Skólavörðustígur 42 | `Verslun Virka daga: 8-23.30 Helgar: 9-23.30` | `channel: 'store'`, `format: 'convenience'`, `region: 'capital-region'` |
| Austurstræti í göngugötu | `Verslun 24/7` | `channel: 'store'`, `format: 'convenience'`, `region: 'capital-region'` |

The footer lists `Hagasmári 1 | 201 Kópavogur` as the company/contact address, not as a priced retail catalogue source.

## Required quirk review

1. **Online vs in-store prices** — No online shop, online ordering price, or product price is published on the listed source. The connector therefore emits only `channel: 'store'` store rows and does not fabricate online price rows.
2. **Loyalty program** — No loyalty programme name, requirements, discount percentage, or member price is published on the listed source. The connector keeps `hasMemberPrice: false`.
3. **Format / sub-brand** — The listed stores are presented under the same 10-11 convenience chain. The source also mentions food-service tenants/hours such as Sbarro and Bæjarins Beztu, but it does not publish separate grocery price levels for those tenants. The connector emits `format: 'convenience'` for the 10-11 store rows only.
4. **Region / store-cluster** — The visible stores are Reykjavík/capital-area addresses. No source price delta by region is published. The connector tags the visible rows as `region: 'capital-region'` and does not emit region-specific price rows.
5. **Subscription / membership-required pricing** — No subscription price terms are published on the listed source. The connector keeps `hasSubscriptionPrice: false`.
6. **App-only / coupon-required prices** — No app-only or coupon-required product prices are published on the listed source. The connector keeps `hasCouponPrice: false`.
7. **Time-of-day or close-to-close clearance** — The source publishes opening hours only; it does not publish evening, late-store, or clearance discount rules. The connector keeps `hasClearancePrice: false`.
8. **Bulk / volume pricing tiers** — No “buy N” or per-unit volume offer is published on the listed source. The connector keeps `hasMultiBuy: false`.
9. **Service-counter vs packaged** — No grocery counter price or packaged-price comparison is published on the listed source. The connector keeps `hasCounterPrice: false`.
10. **B2B / wholesale split** — No restaurant/cafe wholesale price terms are published on the listed source. The connector keeps `hasB2BPrice: false`.

## Connector impact

`packages/ingestion/src/connectors/ten-eleven-is.ts` parses the primary-source homepage into store rows with only the fields justified above. It intentionally does not emit item price rows because the listed source does not expose verifiable product prices.
