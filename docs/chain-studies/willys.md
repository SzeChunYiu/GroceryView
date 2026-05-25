# Willys pricing quirks (SE)

Sources checked: willys.se public pages and Willys public campaign/search endpoints on 2026-05-25. Claims below are limited to those sources.

## Online vs in-store

Willys says e-commerce uses the same low prices as its regular stores. The home-delivery page states that a 59 SEK picking fee and 99 SEK delivery cost are added, while product prices are otherwise the same online as in ordinary stores: https://www.willys.se/artikel/hemleverans. Willys' app page also says e-commerce in the app uses the same low prices as in store: https://www.willys.se/artikel/om-willys-appen.

Connector action: keep per-row channel context (`channel: 'online' | 'store'`) but do not synthesize an online/store price delta.

## Loyalty program / member prices

Willys Plus is Willys' free digital loyalty program. Willys' terms say customers may shop at willys.se and in Willys stores without joining, but non-members cannot access all offers or value vouchers: https://www.willys.se/artikel/kundservice/villkor-for-willys-plus. Willys Plus marketing says members receive more and better offers without a separate wallet card: https://www.willys.se/Om-oss/willysplus/Willysappen.

Concrete campaign example from the public campaign endpoint `https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=20`: Bregott (`mainProductCode: 101545068_ST`) returned `campaignType: 'LOYALTY'`, `redeemLimitLabel: 'Max 3 köp'`, ordinary `priceNoUnit: '51.5'`, and promotion `price: 37.8` / `cartLabel: '37,80/st '`. Another row for Laxfilé 4-pack (`mainProductCode: 101877325_ST`) returned `campaignType: 'LOYALTY'` and a multi-buy label `cartLabel: '2 för 99,00'`.

Connector action: weekly discount rows set `isMemberPrice: true` for `campaignType: 'LOYALTY'` or explicit Willys Plus labels.

## Format / sub-brand

Willys says it has two store concepts, Willys and Willys Hemma: https://www.willys.se/artikel/vararoller. The checked Willys sources do not publish a verified price-rule difference between the concepts.

Connector action: store rows expose `format: 'willys' | 'willys-hemma'` from the store name so downstream comparisons can group prices without assuming a difference.

## Region / store-cluster

The store API exposes individual store IDs and cities. The checked Willys sources do not publish a verified regional price rule. Campaign requests are store-scoped (`q=<storeId>`), so the connector preserves `storeId`, `storeName`, and `city` on all-store rows.

## Subscription / membership-required pricing

No paid subscription that unlocks different product prices was verified in the checked Willys sources. Willys Plus is free, so it is handled as loyalty pricing, not subscription pricing.

Connector action: set `isSubscriptionPrice: false`.

## App-only / coupon-required prices

The app page says the app shows current offers and possible personal offers: https://www.willys.se/artikel/om-willys-appen. The public campaign rows checked above did not expose a coupon-required flag or app-only flag.

Connector action: set `isCouponPrice: false` until a concrete source row exposes a coupon/app-only requirement.

## Time-of-day / clearance

No daily evening, close-to-close, or clearance price rule was verified in the checked Willys sources.

Connector action: set `isClearance: false`.

## Bulk / volume pricing tiers

The public campaign endpoint exposes multi-buy offers. The Laxfilé 4-pack example above returned `qualifyingCount: 2`, `conditionLabel: '2 för'`, and `cartLabel: '2 för 99,00'`.

Connector action: weekly discount rows emit `multiBuy` when `qualifyingCount > 1`.

## Service-counter vs packaged

No service-counter versus packaged price split was verified in the checked Willys sources.

## B2B / wholesale split

No consumer/B2B wholesale split was verified in the checked Willys sources. Out of scope for the consumer connector unless Willys exposes mixed consumer inventory with separate B2B rows.
