# Apotek Hjärtat SE pricing study

Primary source scope: apotekhjartat.se pages only, checked for product pricing quirks on 2026-05-25.

## Source-backed findings

| Requirement | Apotekhjartat.se evidence | Connector action |
| --- | --- | --- |
| Online vs in-store prices | Product pages publish online prices and `Butikspris` side by side. Vichy Homme Shaving Foam 200 ml shows a discounted online price from an ordinary online price of 105 kr and a store price of 139 kr (`https://www.apotekhjartat.se/produkt/vichy-homme-shaving-foam-200-ml/`); Haga Eyewear Optical Wet Wipes 30 st shows an ordinary online price of 29 kr and a store price of 45 kr (`https://www.apotekhjartat.se/produkt/haga-eyewear-optical-wet-wipes-30-st`). | Emit `channel:'online'` rows for the web price and `channel:'store'` rows when `storePrice` is present. |
| Loyalty program | The Klubb Hjärtat page says members get personal offers, unique discounts, bonus opportunities, ICA shared bonus when also ICA Stammis, and member offers (`https://www.apotekhjartat.se/klubb-hjartat`). The partner-benefits page documents Klubb Hjärtat student discount in pharmacies and an online ICA/Stammis Student offer (`https://www.apotekhjartat.se/samarbetspartners-och-klubbformaner`). | Emit `is_member_price:true` when product payload labels identify Klubb Hjärtat, medlem, or ICA-linked member pricing. |
| Format / sub-brand | The reviewed Apotek Hjärtat pages present one pharmacy chain and e-commerce site. No source reviewed publishes different price levels by format or sub-brand. | No `format` field is emitted. |
| Region / store-cluster | Product pages expose `Butikspris` as a store-channel price, but the reviewed pages do not publish regional price clusters or named urban/rural price rules. | Store rows keep `channel:'store'`; no region tag is inferred. |
| Subscription / membership-required pricing | No Apotekhjartat.se product or Klubb Hjärtat page reviewed documented a subscription price for consumer product rows. | No `is_subscription_price:true` row is emitted. |
| App-only / coupon-required prices | The partner-benefits page says some discounts cannot be combined with rabattkoder, and product/member labels can identify coupon requirements. | Emit `is_coupon_price:true` only when the product payload explicitly marks coupon/rabattkod requirement. |
| Time-of-day / close-to-close clearance | No reviewed Apotekhjartat.se page documented daily time-of-day or close-to-close clearance pricing. | No `is_clearance:true` row is emitted. |
| Bulk / volume tiers | Apotek Hjärtat product and campaign labels can carry explicit volume mechanics such as `2 för ...`. | Preserve explicit volume mechanics in `multi_buy`. |
| Service-counter vs packaged | Apotek Hjärtat is a pharmacy; the reviewed pages do not document supermarket-style counter vs packaged pricing. | No counter/packaged channel is emitted. |
| B2B / wholesale split | The reviewed pages describe consumer pharmacy/e-commerce pricing and member benefits, not restaurant/cafe wholesale pricing. | No B2B/wholesale row is emitted. |

## Codified examples

- `channel:'online'` and `channel:'store'`: justified by product pages showing online prices and `Butikspris` on the same SKU.
- `is_member_price:true`: justified by Klubb Hjärtat and ICA-linked member-benefit text.
- `is_coupon_price:true`: codified only for payloads that explicitly require a coupon or rabattkod.
- `multi_buy`: codified only for explicit product/campaign volume text such as `2 för ...`.
