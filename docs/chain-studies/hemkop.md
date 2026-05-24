# Hemköp pricing quirks (primary-source study)

Sources checked: Hemköp pricing explainer, Klubb Hemköp pages, Hemköp app terms, Hemköp e-commerce terms, Hemköp app page, Hemköp store pages, and Hemköp online/business pages. Claims below are limited to what those Hemköp sources state.

## Source links

- Pricing explainer: https://www.hemkop.se/artikel/prissattning
- Weekly club prices: https://www.hemkop.se/artikel/klubbpriser
- Klubb Hemköp mechanics: https://www.hemkop.se/artikel/sa-har-funkar-klubb-hemkop
- App terms: https://www.hemkop.se/artikel/appvillkor
- App feature page: https://www.hemkop.se/artikel/mobilapp
- E-commerce terms: https://www.hemkop.se/artikel/anvandarvillkor
- Online-shopping information: https://www.hemkop.se/artikel/handla-online
- Example store/offers page: https://www.hemkop.se/erbjudanden/4138
- Example store page with service counter: https://www.hemkop.se/butik/4605

## Findings codified in the connector

| Quirk | Verifiable Hemköp evidence | Connector behavior |
| --- | --- | --- |
| Online and store prices are separate channels | Hemköp states that prices shown on hemkop.se apply to e-commerce and that store prices can vary by store or town. E-commerce terms state the order uses the prices shown when the order is completed. | Product catalog rows now emit `channel:'online'`. Weekly/offline campaign rows now emit `channel:'store'`. |
| Store/region variation exists | The pricing explainer says prices in stores can vary depending on which store or town the customer shops in. Store offer pages are scoped by store id, for example `/erbjudanden/4138`. | Existing `storeId`, `storeName`, and `city` remain the region tags for store campaign rows; no extra region field is added without a published region taxonomy. |
| Klubb Hemköp member prices | Hemköp labels member prices as `Klubbpris`; non-members pay ordinary price. The club-price page says members get weekly exclusive offers both in stores and online. | Weekly/offline campaign rows now emit `is_member_price:true` when campaign text indicates club/member/bonus pricing. |
| Personal offers and coupon-like benefits | Klubb Hemköp describes personal offers for logged-in members; app terms say club members may receive offers and campaign information, including push notifications; the app page says members can access personal offers. | Campaign rows now emit `is_coupon_price:true` only when source campaign text contains coupon/personal-offer language. The public connector does not fabricate logged-in personal offers. |

## Findings documented but not codified

1. **Largest online-vs-store category deltas:** Hemköp confirms store/town variation, but the listed sources do not publish category-level delta measurements. No category-delta field is added.
2. **Format or sub-brand price levels:** The listed sources do not document Hemköp format tiers comparable to ICA Maxi/Nära. No `format` field is added.
3. **Subscription pricing:** The listed sources do not describe a paid subscription that unlocks product prices. No `is_subscription_price` field is added.
4. **App-only prices:** Hemköp documents app access to offers, personal offers, shopping, receipts, and store information. The listed sources do not state a general app-only price tier separate from club/personal offers. No app-only channel is added.
5. **Time-of-day or close-to-close clearance:** The pricing explainer documents `Klipp` as temporary lower-priced lots/products, but the listed sources do not describe a daily evening or close-to-close discount pattern. No `is_clearance` field is added.
6. **Bulk or volume tiers:** The public weekly campaign API already exposes campaign condition text such as maximum purchases and promotion type. The listed Hemköp pages checked here do not publish a general “buy N+” tier rule. No separate `multi_buy` row shape is added.
7. **Service-counter versus packaged:** The Huddinge Centrum store page lists a `Delidisk`, but the listed sources do not publish separate counter item prices versus packaged item prices. No `channel:'counter'` rows are emitted.
8. **B2B or wholesale split:** Hemköp has a company sign-up path and online-shopping page mentions company shopping help. The listed sources do not publish a separate wholesale price feed mixed with consumer inventory. No B2B fields are added.

## Connector guardrail

Only fields tied to concrete public Hemköp evidence are emitted. Logged-in personal offers, unpublished app-only offers, category deltas, and service-counter prices are documented as unavailable from the listed public sources and are not inferred.
