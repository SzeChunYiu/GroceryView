# Apotek Hjärtat SE pricing quirks (primary-source study)

Sources are Apotek Hjärtat pages only.

## Online vs in-store

Apotek Hjärtat product pages expose a web price and a separate `Butikspris`. Verified examples:

- Barebells Soft Bar Banana Dream 55 g: online price 18,40 kr; `Butikspris` 32,90 kr; page marks the campaign as `20% online`.
- Pixi Clarity Concentrate 30 ml: online price 279,30 kr; ordinary online price and `Butikspris` 399 kr; page marks the campaign as `30% online`.
- Glukosamin Pharma Nord kapsel 400 mg 90 st: online price 152,15 kr; `Butikspris` 179 kr; page marks the campaign as `15% online`.
- Melatan Tablett 3mg Blister, 50tabletter: online price 179,80 kr and `Butikspris` 179,80 kr, proving the two fields can also match.

The largest verified deltas in this sample are Mat & dryck/protein bars, beauty/skin-care, and OTC/self-care products. The connector emits separate `channel: 'online'` and `channel: 'store'` rows when both prices are present.

## Loyalty program

The program name is Klubb Hjärtat. Apotek Hjärtat states that members get bonus, personalized offers, sale priority, and other benefits. The membership terms say members get offers and bonus points, and that benefits require proof of membership; online purchases require login. The Klubb Hjärtat FAQ says exclusive club offers require membership and that membership is free.

Verified broad discounts:

- Student: Klubb Hjärtat members get 5% in physical apotek on Tuesdays and Wednesdays with valid student ID; online, Klubb Hjärtat plus ICA Stammis Student gives 15% over 250 kr.
- Senior: Klubb Hjärtat members aged over 65 get 5% on Tuesdays and Wednesdays in apotek and online; online requires the code `KHSE5`.

The connector emits `is_member_price: true` for rows whose campaign text names Klubb Hjärtat/Klubb/medlem/student/senior/Stammis. It emits `is_coupon_price: true` when a campaign requires a code such as `KHSE5`.

## Format / sub-brand

No Apotek Hjärtat source above identifies separate price formats comparable to ICA Maxi/Nära. The connector does not emit a `format` field.

## Region / store-cluster

The verified pages ask shoppers to choose an apotek for stock status, but the sources above do not publish regional price ladders. The connector does not infer region tags.

## Subscription / membership-required pricing

No subscription price was verified. The connector does not emit subscription-price rows.

## App-only / coupon-required prices

The senior online discount requires entering code `KHSE5` in checkout. The connector emits `is_coupon_price: true` only when a code-like marker is present.

## Time-of-day or close-to-close clearance

No evening or close-to-close clearance pattern was verified. The connector does not emit `is_clearance` rows.

## Bulk / volume pricing tiers

The offers listing contains explicit volume mechanics such as `2 för 25%`, `3 för 2`, and fixed-price multi-buy strings like `2 för 35kr`. The connector emits a `multi_buy` object when such text is present.

## Service-counter vs packaged

Not applicable to the verified pharmacy/product pages; no service-counter price was found.

## B2B / wholesale split

No consumer page above exposes a restaurant/cafe/wholesale price split. Out of scope for the connector.
