# Apohem (SE) pricing quirks

Sources used (primary only):

- Apohem home page: https://www.apohem.se/
- Apohem weekly offers: https://www.apohem.se/erbjudande
- Apohem discount-code page: https://www.apohem.se/rabattkod
- Apohem high-cost protection article: https://www.apohem.se/lakemedel/hogkostnadsskydd

## 1. Online vs in-store

Apohem presents itself as an online pharmacy with online product listings, free shipping on purchases, and pharmacist/skin-therapist advice. The listed sources do not show physical store prices. The connector emits `channel: 'online'` only.

## 2. Loyalty program

The home page says customers get points on purchases, and the rabattkod page says new Club Apohem members can get 15% off their first purchase when shopping for 299 kr. The connector does not mark normal product rows as member prices unless a source row explicitly carries a member-only flag; current parsed Apohem product rows use `is_member_price: false`.

## 3. Format / sub-brand

No Apohem sub-format price levels are documented in the listed sources. The connector emits `format: 'apohem-online'`.

## 4. Region / store-cluster

No regional or store-cluster price differences are documented. The connector emits `store_id.region: 'SE-online'`.

## 5. Subscription / membership-required pricing

The listed sources do not document a subscription that unlocks lower product prices. No `is_subscription_price` rows are emitted.

## 6. App-only / coupon-required prices

The home/offers surfaces show app-only WOW Deals up to 50% and the `APP20` app code for 20% in the app above 499 kr. The rabattkod page also documents a new-member 15% code. The current product connector keeps product-level rows conservative and emits `is_coupon_price: false` unless a future parsed product row exposes a concrete coupon flag.

## 7. Time-of-day or close-to-close clearance

The listed sources do not document a daily time-of-day or close-to-close clearance pattern. No `is_clearance` rows are emitted.

## 8. Bulk / volume pricing tiers

The listed sources do not document a structured `N+` multi-buy price. No `multi_buy` rows are emitted.

## 9. Service-counter vs packaged

Apohem is online-only in the listed sources. The connector does not emit `counter` or `packaged` channels.

## 10. B2B / wholesale split

The listed sources do not document restaurant/cafe wholesale pricing. B2B rows are out of scope.
