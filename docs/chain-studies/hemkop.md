# Hemkop pricing quirks (SE)

Primary source scope: hemkop.se pages and public Hemkop/Axfood JSON endpoints reviewed on 2026-05-25.

## Verified quirks

### Online vs in-store prices

Hemkop's pricing explainer says prices shown on hemkop.se apply to e-commerce and that prices in stores can vary by store or town: https://www.hemkop.se/artikel/prissattning.

The public product search endpoint is an e-commerce/catalog source. Example source: `https://www.hemkop.se/search?q=smor&page=0&size=5&store=4003` returned product rows with `online: true`, `priceValue`, `price`, `comparePrice`, and `comparePriceUnit`.

Connector impact: Hemkop product rows emit `channel: 'online'` when the source row has `online: true`; otherwise they emit `channel: 'store'`. Weekly offer rows from the store-scoped campaign endpoint emit `channel: 'store'`. No same-SKU store comparison row is synthesized unless a source payload supplies it.

### Klubb Hemkop member pricing and personal offers

Hemkop's membership pages identify the program as `Klubb Hemkop`. The signup page asks private members for a personal identity number, and the club explainer says members receive personal offers, club prices, points, bonus checks, and benefit tiers. It also says `1 kr = 1 point`, that Step 2 unlocks personal offers selected for the shopper, and that those offers can have a standing discount for the month: https://www.hemkop.se/registrera/privat/identifiera and https://www.hemkop.se/artikel/sa-har-funkar-klubb-hemkop.

The public store campaign endpoint `https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=10` returned loyalty examples such as Bregott with `campaignType: 'LOYALTY'`, `cartLabel: '39,95 kr/st'`, `redeemLimitLabel: 'Max 5 kop'`, and `priceNoUnit: '51.05'`.

Connector impact: weekly campaign rows emit `isMemberPrice: true` when `campaignType` is `LOYALTY` or the source text contains membership wording.

### Store and region scoping

The public store endpoint `https://www.hemkop.se/axfood/rest/store?online=true` returns branch identifiers, names, towns, postal codes, `onlineStore`, `clickAndCollect`, and flyer URLs.

Connector impact: all-store product and weekly offer ingestion preserves `storeId`, `storeName`, and `city`. This supports store/town scoped comparison without inventing a broader regional price rule.

### App, coupon, and rabattkod pricing

Hemkop's app terms say app functions include buying goods and receiving news, offers, and campaigns. The terms also say app e-commerce follows the e-commerce terms and that app use is free: https://www.hemkop.se/artikel/appvillkor. The club explainer says bonus checks, rabattkuponger, points, personal offers, and actions are collected in the Hemkop app or on hemkop.se while logged in.

Connector impact: campaign rows emit `isCouponPrice: true` only when the source promotion text identifies a coupon, rabattkod, rabattkupong, or personal offer requirement.

### Klipp and temporary clearance-like offers

Hemkop's pricing explainer defines `Klipp` as temporary batches/products sold at a lower price and marked with `klipp`; it also states prior lowest price is shown when available: https://www.hemkop.se/artikel/prissattning.

Connector impact: promotion rows emit `isClearance: true` when source promotion fields contain `klipp`.

### Bulk / volume promotions

Hemkop's public campaign endpoint exposes promotion mechanics in fields such as `conditionLabel`, `cartLabel`, and `qualifyingCount`. The connector treats explicit `qualifyingCount > 1` as the source-backed multi-buy signal.

Connector impact: weekly offer rows emit `multiBuy` with the qualifying count and source label when the payload supplies those fields.

## Not verified from hemkop.se in this study

- Product categories with the largest online/store deltas: Hemkop states store prices can vary by store or town, but the reviewed first-party pages did not publish a category-level delta table.
- Format or sub-brand price levels: no Hemkop store format hierarchy comparable to ICA Maxi/Nara or Coop X:-TRA was found in the reviewed sources.
- Paid subscription pricing: no subscription product or paid membership unlocking grocery prices was found. App use is documented as free.
- Service-counter vs packaged prices: no same-item cheese, deli, or charcuterie counter/package price split was found in the reviewed sources.
- B2B / wholesale split: Hemkop exposes company-customer flows, but the reviewed sources did not publish consumer-comparable restaurant, cafe, or wholesale item prices.
