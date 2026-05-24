# Krambúðin IS pricing quirks primary-source study

Sources checked: `krambudin.is` only.

Primary-source URLs:

- https://www.krambudin.is/
- https://www.krambudin.is/um-okkur/
- https://www.krambudin.is/opnunartimar/
- https://www.krambudin.is/tilbod/
- https://www.krambudin.is/app/
- https://www.krambudin.is/frettir/tilkynning-krambud/
- https://www.krambudin.is/category/frettir-is/
- https://www.krambudin.is/frettir/krambudin-opnar-i-urridaholti/

## Connector changes justified by source

`packages/ingestion/src/connectors/krambudin-is.ts` emits one codified quirk row:

- `channel:'store'`, `is_member_price:true`, and `is_coupon_price:true` for selected weekly app offer products in the Samkaupa app. The app page says shoppers can save in the form of credit when shopping at Krambúðin and use weekly app offers with up to 50% app discount. The March 2025 notice says the fixed 2% app credit ended on 3 March and customers now collect credit when buying offer products.

No other field is emitted because the primary sources above do not publish a concrete product price, multi-buy tier, subscription price, clearance price, counter price, B2B price, format price, or regional price split.

## 1. Online vs in-store

Krambúðin announced that Wolt home delivery was discontinued from 18 July 2025. The notice says fifteen stores in the capital area, Akureyri, Reykjanesbær, and Selfoss had used Wolt before the service ended.

Result: no current online price channel is codified. The source does not publish online product prices, in-store product prices, or category deltas between Wolt and store prices.

## 2. Loyalty program

Program: Samkaupa appið.

Requirements/scope visible from source: the app page describes savings as credit when shopping at Nettó, Krambúðin, Kjörbúðin, Iceland, and netto.is, and weekly app offers with up to 50% app discount in the form of credit. The Krambúðin March 2025 notice says the fixed 2% app credit ended on 3 March; after that, customers collect credit when offer products are bought.

Connector: emit `is_member_price:true` and `is_coupon_price:true` for selected weekly app offer rows. Do not emit an every-item member price.

## 3. Format / sub-brand

The about page describes Krambúðin as convenience stores. The Urriðaholt opening article says Samkaup also operates Nettó and Kjörbúðin, but it does not identify Krambúðin sub-formats with separate price levels.

Connector: no `format` field.

## 4. Region / store-cluster

The front page/about/opening-hours pages list Krambúðin stores across Iceland, including the capital area, Selfoss, Akranes, Flúðir, Laugarvatn, Búðardalur, Hólmavík, Keflavík, Njarðvík, Húsavík, Reykjahlíð, and Akureyri. The Wolt closure notice names former delivery clusters, but no source page states different Krambúðin prices by region or cluster.

Connector: no region price tag is emitted.

## 5. Subscription / membership-required pricing

No checked Krambúðin source describes a paid subscription or subscription-only price.

Connector: no `is_subscription_price:true` rows.

## 6. App-only / coupon-required prices

The app page states weekly app offers with up to 50% app discount as credit. The March 2025 notice says customers now collect credit when offer products are bought.

Connector: app offer rows use `is_coupon_price:true` and `is_member_price:true`.

## 7. Time-of-day or close-to-close clearance

The checked sources publish opening-hours and regular offer information, but no daily evening, late-store, or close-to-close clearance pricing pattern.

Connector: no `is_clearance:true` rows.

## 8. Bulk / volume pricing tiers

No checked source publishes a concrete “buy N+” or unit-price tier for Krambúðin.

Connector: no `multi_buy` row.

## 9. Service-counter vs packaged

The checked sources describe Krambúðin as a convenience/neighbourhood store and mention ready food/snacks in opening material, but do not publish service-counter versus packaged price examples.

Connector: no `channel:'counter'` rows.

## 10. B2B / wholesale split

No checked Krambúðin source describes restaurant/café wholesale pricing.

Connector: no B2B rows.
