# DocMorris (SE / cross-border EU) pricing quirks

Sources used (official DocMorris primary sources):

- DocMorris online pharmacy home page: https://www.docmorris.de/
- DocMorris corporate markets and brands: https://corporate.docmorris.com/en/about-us/business/markets-and-brands/

## Source boundary

No active Swedish `docmorris.se` retail catalogue was available from the listed source during this study. The active official DocMorris consumer storefront found in primary sources is DocMorris Germany, while the corporate site says DocMorris focuses on Germany, Spain, and France. The connector therefore treats DocMorris SE as a cross-border EU online-only surface and does not emit Swedish store rows.

## 1. Online vs in-store

DocMorris is presented as an online pharmacy/healthcare platform. The source does not list Swedish physical stores or in-store prices. The connector emits `channel: 'online'` only.

## 2. Loyalty program

The DocMorris home page advertises newsletter savings and points, but the listed sources do not provide a universal member price percentage for all products. The connector does not emit `is_member_price` rows.

## 3. Format / sub-brand

The corporate source lists DocMorris as a brand and mentions brand cooperation with medpex and Apotal. The connector uses `format: 'docmorris-online'` for DocMorris rows and does not mix medpex/Apotal inventory into DocMorris SE.

## 4. Region / store-cluster

No Swedish store-cluster pricing is documented. The connector marks rows with `store_id.region: 'EU-cross-border'` rather than a Swedish city or county.

## 5. Subscription / membership-required pricing

The DocMorris home page advertises `Rezept-Abo` for follow-up prescriptions. The connector emits a service row with `is_subscription_price: true` and no product price because the source describes the subscription service, not a fixed SKU price.

## 6. App-only / coupon-required prices

The DocMorris home page advertises a 5 € newsletter voucher. The connector emits this as `is_coupon_price: true` with `coupon_value: 5` and `currency: 'EUR'`.

## 7. Time-of-day or close-to-close clearance

The listed sources do not document daily time-of-day or close-to-close clearance. No `is_clearance` rows are emitted.

## 8. Bulk / volume pricing tiers

The DocMorris home page advertises tiered savings highlights, but this study did not find a stable SKU-level `N+` unit-price rule in the listed sources. No `multi_buy` rows are emitted.

## 9. Service-counter vs packaged

No service-counter channel is documented. The connector does not emit `counter` or `packaged` channels.

## 10. B2B / wholesale split

The listed sources describe consumer online pharmacy surfaces and corporate brands, not restaurant/cafe wholesale pricing. B2B rows are out of scope.
