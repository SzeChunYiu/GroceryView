# Matpriskollen pricing quirks (SE)

Primary source scope: matpriskollen.se pages and Matpriskollen API fields reviewed on 2026-05-25.

## Verified quirks

### Comparison-site, store-local prices

Matpriskollen describes itself as an independent, free food-price service where users can find today's food prices, compare weekly offers in nearby stores, save favourite stores, and search offers near them. The homepage lists named physical stores near Falkenberg with distances and offer counts, then shows product offers tied to a specific store, for example Willys Falkenberg, Lidl Falkenberg, and Coop Slättenvägen.

Connector impact: Matpriskollen rows represent physical-store offers, so rows emit `channel: 'store'`. Store rows keep the source store id and append the crawl region name when present, so the same chain can be compared across regions without collapsing local prices.

### Offer freshness and validity windows

Matpriskollen's service is about current offers in stores. Its API exposes `validFrom` and `validTo` timestamps per offer, and the connector already normalizes those to ISO strings. Public pages describe current/weekly offers and today's food prices.

Connector impact: keep `validFrom`, `validTo`, `retrievedAt`, and `sourceUrl` on every row.

### Chain format / sub-brand differences

Matpriskollen exposes individual store names and its public pages show different formats within chains, including ICA Kvantum, ICA Supermarket, ICA Nära, Stora Coop, Coop X:-TRA, Willys, Lidl, City Gross, and Hemköp. Because offers are store-local, these formats can have different prices and offer counts.

Connector impact: derive a normalized `format` from the store name when the format is present.

### Loyalty-card and coupon requirements

The Matpriskollen offer API exposes `requiresMembershipCard` and `requiresCoupon` booleans. Those are product-offer requirements rather than Matpriskollen's own loyalty program.

Connector impact: mirror `requiresMembershipCard` to `is_member_price` and `requiresCoupon` to `is_coupon_price`.

### Bulk / volume promotions

Matpriskollen's public news pages discuss multibuy campaigns, and the offer API has a `condition` field that carries offer mechanics. When the condition text contains explicit volume mechanics such as `2 för`, `3 för 2`, or `% vid köp av N`, the row should preserve that text.

Connector impact: emit matching condition text as `multi_buy`.

## Not verified from matpriskollen.se in this study

- Online prices: no Matpriskollen online-order channel price was verified.
- Matpriskollen-owned loyalty pricing: Matpriskollen has accounts/favourite stores, but no Matpriskollen loyalty price was verified.
- Paid subscription pricing: no paid subscription unlocking prices was verified.
- Daily time-of-day or close-to-close clearance: no recurring time-of-day clearance pattern was verified.
- Service-counter vs packaged prices: no counter/package channel split was verified in the Matpriskollen fields reviewed.
- B2B / wholesale split: Matpriskollen has a B2B portal link, but no mixed consumer/B2B price rows were verified for this connector.
