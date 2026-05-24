# DocMorris SE pricing quirks

Primary sources checked on 2026-05-24:

- `http://docmorris.se/` returned an HTTP 301 redirect to `https://docmorris.de`.
- DocMorris corporate markets page: https://corporate.docmorris.com/en/about-us/business/markets-and-brands/
- DocMorris DE home page: https://www.docmorris.de/
- Prescription subscription page: https://www.docmorris.de/rezepte/rezept-abo
- Shipping-cost help page: https://support.docmorris.de/hc/de/articles/18982804006545-Wie-hoch-sind-die-Versandkosten
- Coupon page: https://www.docmorris.de/lp/gutschein
- Points page: https://www.docmorris.de/punkte

## Source boundary

The Swedish host did not expose a Sweden-specific storefront during this study; it redirected to the German DocMorris storefront. The corporate markets page lists the active key markets as Germany, Spain, and France. Therefore the SE connector must not invent Sweden-specific store, region, or in-store price rows. The codified fields below are limited to facts visible on the redirected DocMorris web/app surface.

## Quirk matrix

| Quirk | Verified from listed sources? | Connector action |
| --- | --- | --- |
| Online vs in-store | Yes for online-only capture: `docmorris.se` redirects to an online DocMorris storefront and no Sweden physical-store price surface was exposed by the listed sources. | Emit `channel: 'online'` for any captured DocMorris SE/redirect row. Do not emit `channel: 'store'` without a new primary source. |
| Loyalty program | Yes. The points page says customers collect DocMorris points on website/app orders for non-prescription products, excluding guest orders, and can redeem points in the cart as a discount. | Emit `is_member_price: true` only when a row's captured price is reduced by DocMorris points/member redemption evidence. |
| Format / sub-brand | Not verified for Sweden. | Do not emit `format`. |
| Region / store-cluster | Not verified for Sweden. | Do not add region tags to `store_id`. |
| Subscription / membership-required pricing | Yes for service terms, not for a distinct product unit price. The prescription subscription page describes a repeat-prescription service, no shipping cost for subscription orders, availability for statutory/private insured patients, and cancellation without contract binding. | Emit `is_subscription_price: true` only if the captured row is a prescription-subscription row whose price or shipping treatment is present in the source capture. |
| App-only / coupon-required prices | Yes. Coupon terms cover website/app coupon redemption, customer-account requirements, validity windows, exclusions, and examples of app/E-prescription coupons. | Emit `is_coupon_price: true` when a captured price requires a coupon/app code. |
| Time-of-day / close-to-close clearance | Not verified. | Do not emit `is_clearance`. |
| Bulk / volume tiers | Verified for tiered coupon thresholds on the coupon page (for example discount amount tied to minimum order value), not a per-unit multi-buy product tier. | Emit `multi_buy` only for explicit product-level N+ pricing; do not use it for basket-level coupon thresholds. |
| Service-counter vs packaged | Not verified; no Sweden store counter source was exposed. | Do not emit `channel: 'counter'`. |
| B2B / wholesale split | Not verified for the listed sources. | Out of scope; emit no B2B rows. |

## Concrete examples codified

- `channel: 'online'` is justified by the `docmorris.se` redirect and the web/app order surfaces on DocMorris.
- `is_coupon_price: true` is justified only for rows tied to a coupon or app code from the coupon source.
- `is_member_price: true` is justified only for rows tied to DocMorris points redemption.
- `is_subscription_price: true` is justified only for rows tied to the prescription subscription flow; the source justifies the flag, not a blanket lower unit price.
- `multi_buy` remains supported by the connector shape but must stay unset until a product-level N+ price is captured from a primary source.
