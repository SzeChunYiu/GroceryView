# Matpriskollen (SE) pricing quirks

Sources used (primary only):

- Matpriskollen home page: https://matpriskollen.se/
- Butiker page: https://matpriskollen.se/butiker
- Produkter page: https://matpriskollen.se/produkter
- Om Matpriskollen: https://matpriskollen.se/om-matpriskollen
- Allmänna villkor: https://matpriskollen.se/allmanna-villkor-matpriskollen
- Handlare/butiker: https://matpriskollen.se/handlare-butiker/

## Data role and freshness

Matpriskollen describes itself as a free, independent grocery price service where users can find today's food prices, compare stores, see current offers, watch products, and build shopping lists. The service says it writes off grocery-store flyers from across Sweden, that Matpriskollen fills with offers from early Monday morning, and that cooperating stores are guaranteed to be present from Monday 00:01. The connector therefore treats rows as store-scoped weekly flyer/store offers and records `freshness: 'weekly_flyer'`.

## 1. Online vs in-store

The sources say users can find prices "in butik" and see current offers in stores. They do not document a separate Matpriskollen online-order price. The connector emits `channel: 'store'` only.

## 2. Loyalty / member program

Matpriskollen is not a retailer loyalty program. Its public offer payload exposes whether an offer requires a membership card. The connector preserves this as `requiresMembershipCard` and mirrors it to `is_member_price` when true.

## 3. Format / sub-brand

The public store list shows store-format names such as Willys, Lidl, Coop, Stora Coop, Coop X:-TRA, ICA Kvantum, ICA Supermarket, ICA Nära, Tempo, and Hemköp. The connector derives a `format` string from the store name so ICA/Coop sub-brand variance can be audited downstream.

## 4. Region / store-cluster

Matpriskollen shows stores near a location with distance and the connector calls store/offer APIs with latitude and longitude. The connector samples named Swedish regions and records the region in `store_id.region` and `storeRegion`.

## 5. Subscription / membership-required pricing

The listed Matpriskollen sources do not describe a subscription that unlocks lower consumer prices. No `is_subscription_price` rows are emitted.

## 6. App-only / coupon-required prices

The public offer payload exposes whether an offer requires a coupon. The connector preserves this as `requiresCoupon` and mirrors it to `is_coupon_price` when true.

## 7. Time-of-day or close-to-close clearance

The listed Matpriskollen sources do not describe a daily evening or close-to-close clearance pattern. No `is_clearance` rows are emitted.

## 8. Bulk / volume pricing tiers

Matpriskollen offer text can include conditions, but the listed sources do not define a guaranteed structured multi-buy field. The connector keeps the original `condition` text and does not emit `multi_buy` until a concrete structured example is available.

## 9. Service-counter vs packaged

The listed sources do not document service-counter versus packaged-channel prices. The connector does not emit `channel: 'counter'` or `channel: 'packaged'`.

## 10. B2B / wholesale split

Matpriskollen has a merchant/B2B portal for stores that want their offers exposed. That is a retailer listing/commercial service, not a consumer wholesale price tier. B2B rows are out of scope for the consumer connector.
