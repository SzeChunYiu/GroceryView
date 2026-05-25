# ICA pricing quirks (SE)

Primary source scope: ica.se, handla.ica.se, ICA store pages, ICA online purchase terms, and ICA Stammis pages reviewed on 2026-05-25.

## Verified quirks

### Store-scoped online grocery prices

ICA Handla Online says customers choose home delivery or pickup from local ICA stores, including Maxi, Kvantum, Supermarket, and Nära. ICA's online purchase terms say the product price is the price that applies when the customer completes checkout, and that pickup/home-delivery picking fees are shown in the online store and can vary by selected store.

Connector impact: ICA connector rows are online-store rows and emit `channel: 'online'`. The connector keeps `storeAccountId`, `storeName`, and `regionId` because prices and service fees are store-scoped.

### Weight-based products

ICA's online purchase terms say some goods are sold by piece but priced by weight; the exact price is established when the order has been picked and the item weighed. ICA online store pages also expose deli/fish/counter services on store pages.

Connector impact: existing `soldByWeight` counter evidence is retained for loose-weight/counter-like rows.

### ICA Stammis member pricing

ICA describes Stammis as its loyalty program. Stammis members earn points on ICA purchases, including online grocery purchases, and get selected better prices and personalised offers. The connector sees promotion text such as `Med ICA Stammis`.

Connector impact: promotion text mentioning Stammis/member pricing emits `is_member_price: true`.

### Formats and regional/store differences

ICA store pages and online shopping pages expose multiple formats: Maxi ICA Stormarknad, ICA Kvantum, ICA Supermarket, and ICA Nära. ICA also lists individual stores and store services, and the connector samples many configured store accounts and regions.

Connector impact: rows emit normalized `format`/`ica_format`, and store/region identifiers remain on every row.

### Coupons, clearance, and multi-buy labels

ICA pages and online payloads can carry promotion descriptions. This study verified member-offer text and ICA store services; durable coupon or daily close-to-close clearance mechanics were not verified from the source set. However, when ICA payloads explicitly label coupon, short-date, or multi-buy mechanics, those labels are product-level promotion evidence.

Connector impact: explicit coupon text emits `is_coupon_price: true`; short-date/clearance text emits `is_clearance: true`; explicit volume mechanics such as `2 för` or `3 för 2` are preserved in `multi_buy`.

## Not verified from ica.se in this study

- Separate physical-shelf vs online unit prices for the same product: no stable pair was verified from the listed source pages.
- Paid subscription pricing: no subscription that unlocks product prices was verified.
- App-only product prices: no app-only price was verified.
- B2B / wholesale split: ICA lists online shopping for companies in store services, but no mixed consumer/B2B product price was verified for this connector.
