# Matspar SE pricing quirks primary-source study

Sources checked: `matspar.se` only.

Primary-source URLs:

- https://www.matspar.se/
- https://www.matspar.se/om-oss
- https://www.matspar.se/matbutik
- https://www.matspar.se/mat-online
- https://www.matspar.se/produkt/risoni-500g
- https://www.matspar.se/produkt/original-750g-latta-1
- https://www.matspar.se/produkt/normalsaltat-82-250-g-svenskt-smor-fran-arla
- https://www.matspar.se/produkt/granolaapplekanel375gfarsking-1st
- https://www.matspar.se/produkt/ica-farskpotatis-import-900g

## Connector changes justified by source

`packages/ingestion/src/connectors/matspar.ts` now records Matspar rows as comparison rows, not retailer-owned prices:

- `channel:'online'`: Matspar describes the service as comparing online grocery stores and online grocery baskets. Product pages and category pages use online-price wording.
- `isComparisonPrice:true` and `isRetailerPrice:false`: Matspar says it is a price-comparison service that lets shoppers compare stores and export the basket to the selected grocery store.
- `pricePointCount`: product page data contains multiple retailer price points for the compared product.
- `multi_buy`: product pages show explicit multi-buy campaigns such as Pasta Risoni `3 för 30,00 kr`, Granola Äpple & Kanel `2 för 73,00 kr`, and Färskpotatis Delikatess `4 för 85,00 kr`.
- `is_member_price:true`: the Pasta Risoni product page data includes a `bonuscard:true` promotion for one of the compared retailer price points.

No subscription, coupon, clearance, counter, B2B, Matspar-owned loyalty, or Matspar format field is emitted because the checked Matspar pages do not justify those fields for Matspar itself.

## Does Matspar sell or compare?

Matspar is a price-comparison service. The about page says Matspar helps consumers explore grocery stores' assortments in one place, compare stores while building a basket, and save money. The matbutik page says the shopper builds a shopping list, Matspar shows which grocery store offers the best total including freight, and the list is exported to the selected store for ordering.

Connector implication: Matspar rows are comparison observations sourced from retailer pages, not Matspar-owned shelf prices.

## 1. Online vs in-store

Matspar's homepage and mat-online page focus on online grocery shopping and comparing online grocery stores. Product pages expose labels such as `Pris i butik`, `Webbpriser`, and `Butiks- & Webbpris`. Examples checked:

- Pasta Risoni: product page shows `Webbpriser`, a `Butiks- & Webbpris` row, and a multi-buy campaign.
- Lätta Margarin Original: product page shows `Pris i butik`, `Webbpriser`, and `Butiks- & Webbpris`.
- Svenskt Smör Normalsaltat 82%: product page shows store and web price sections.

Connector implication: the current search connector emits the online comparison channel. It does not emit a separate store-channel row because the search payload used by the connector does not provide a source-backed store-channel label per price point.

## 2. Loyalty program

Matspar itself does not publish a Matspar loyalty program on the checked pages. Product page data can include retailer loyalty requirements. The Pasta Risoni product page data includes a promotion with `bonuscard:true` and `type:"X_FOR_FIXED"`.

Connector implication: emit `is_member_price:true` only when the Matspar product payload marks a promotion with `bonuscard:true`.

## 3. Format / sub-brand

Matspar compares multiple grocery chains and stores. The checked Matspar sources do not define Matspar sub-brands or Matspar format price levels.

Connector implication: no `format` field.

## 4. Region / store-cluster

Matspar asks for a postcode and compares the available stores for that shopping context. Product pages show specific stores, for example Maxi ICA Stormarknad Haninge, ICA Nära Annedal, and ICA Kvantum Täby C. The checked pages do not publish Matspar region clusters with their own pricing rules.

Connector implication: no Matspar region tag is emitted.

## 5. Subscription / membership-required pricing

The checked pages do not publish a Matspar subscription that unlocks lower prices.

Connector implication: no `is_subscription_price:true` rows.

## 6. App-only / coupon-required prices

The checked pages do not publish Matspar app-only coupons. Retailer bonus-card promotions are handled as member-price promotions, not Matspar coupons.

Connector implication: no `is_coupon_price:true` rows.

## 7. Time-of-day or close-to-close clearance

The checked pages show current online comparisons and campaign prices, but no daily evening or close-to-close clearance pattern.

Connector implication: no `is_clearance:true` rows.

## 8. Bulk / volume pricing tiers

Matspar product pages publish multi-buy offers. Concrete examples checked:

- Pasta Risoni, Barilla 500g: `3 för 30,00 kr`.
- Granola Äpple & Kanel, Färsking 375g: `2 för 73,00 kr`.
- Färskpotatis Delikatess, ICA 900g: `4 för 85,00 kr`.

Connector implication: parse `X_FOR_FIXED` promotions as `multi_buy` rows with `minimum_quantity` and unit price.

## 9. Service-counter vs packaged

The checked product pages are packaged grocery product pages. No checked source publishes a service-counter versus packaged comparison.

Connector implication: no `channel:'counter'` rows.

## 10. B2B / wholesale split

The checked Matspar pages target consumers shopping for groceries online. No checked source describes restaurant/café wholesale pricing.

Connector implication: no B2B rows.
