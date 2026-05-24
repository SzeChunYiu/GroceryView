# Shell (SE) / St1-operated pricing quirks

Sources used (primary only):

- Shell Sverige home page: https://www.shell.se/
- St1 listpris St1-stationer: https://st1.se/foretag/listpris
- St1 listpris för tung trafik: https://st1.se/foretag/listpris-truck
- St1 Mobility-appen: https://st1.se/app-och-erbjudanden/st1-mobility
- St1 Lågt pris: https://st1.se/privat/tjanster/billig-bensin
- St1 Bonustian: https://st1.se/privat/bonustian-kampanj
- PLOQ: https://ploq.se/
- St1 biltvätt Stockholm: https://st1.se/privat/tjanster/biltvatt/biltvatt-stockholm

## What changed about Shell SE

Shell.se says all Shell stations in Sweden have been rebranded to St1. St1.se says St1 grew by 188 stations in 2025 when all Shell stations were rebranded and that Shell Företagskort stopped being valid at St1 stations on 20 November 2025. The connector therefore treats Shell (SE) as `operator: St1 Sverige AB` and `format: st1-station` unless a row is specifically PLOQ or St1 Truck.

## 1. Online vs in-store

No Shell/St1 source listed a separate online order price for fuel or PLOQ food. St1 Mobility is a payment/app-offer channel, not an online grocery order channel. St1's low-price page says the station price sign and pumps show the current price, and the St1 home page says the pump price is the price paid. The connector emits verified fuel list rows as `channel: 'store'` only.

## 2. Loyalty / member program

The listed sources do not describe ClubSmart as an active Shell SE pricing program. St1 Mobility is the active consumer app: it supports cardless fuelling and has app-unique offers. The current Bonustian campaign gives one digital Bonustia for every 15 litres fuelled via St1 Mobility, max three per fuelling, usable at PLOQ/Välkommen in! but not on fuel. The connector does not emit `is_member_price` for Shell SE because the sources do not show a member-price discount percent on a product row. It emits app-only PLOQ food rows as `is_coupon_price: true`.

## 3. Format / sub-brand

The sources distinguish St1 stations, St1 Truck, PLOQ/Välkommen in! food stores, and St1 car wash. The connector uses `format` values `st1-station`, `st1-truck`, `ploq`, and `st1-car-wash`.

## 4. Region / store-cluster

St1 says fuel prices vary locally because of local competition and reports from price spotters several times per day. The business list-price pages are national Sweden list prices. The connector marks list-price rows with `store_id.region: 'SE-national'`. It marks the Stockholm car-wash/night discount row with `store_id.region: 'SE-Stockholm'` because the cited page is Stockholm-specific.

## 5. Subscription / membership-required pricing

St1's car-wash pages list monthly wash subscriptions: Allra bäst 599 kr/month, Bäst 499 kr/month, Bättre 359 kr/month, and Bra 299 kr/month. The connector emits those rows with `is_subscription_price: true`.

## 6. App-only / coupon-required prices

St1 Mobility advertises app-unique offers for PLOQ/Välkommen in!. PLOQ lists a weekly App-fika for 10 kr with St1 Mobility and a summer children's meal price of 27 kr (ordinary price 47 kr) with St1 Mobility. The connector emits both as `is_coupon_price: true`.

## 7. Time-of-day / close-to-close clearance

The Stockholm car-wash page gives half price on selected wash programs between 21:00 and 06:00, only during store opening hours. The connector emits this as `is_clearance: true` with `discount_percent: 50` and `store_id.region: 'SE-Stockholm'`. No primary source listed evening food clearance, so no food clearance rows are emitted.

## 8. Bulk / volume pricing tiers

The Bonustian campaign is volume-triggered: 15 litres gives one 10 kr Bonustia, 30 litres gives two, 45 litres gives three, max three per fuelling. Because the source describes a digital value instrument rather than a direct product unit price, the connector records the tier in `multi_buy` on a Bonustian promotion row instead of altering fuel unit prices.

## 9. Service-counter vs packaged

The listed sources do not describe Shell/St1/PLOQ service-counter pricing versus packaged pricing. The connector does not emit `channel: 'counter'` or `channel: 'packaged'` rows.

## 10. B2B / wholesale split

St1 has St1 Business list prices for light traffic and a weekly St1 Truck list price for heavy traffic; the truck page says St1 Business-card heavy traffic customers are debited weekly list price minus any discount and that pump display can show a fictive 1 kr/litre while the receipt shows the correct price. Consumer connector rows keep these separate via `format: 'st1-station'` for light traffic list price and `format: 'st1-truck'` for truck list price. Business-specific negotiated discounts remain out of scope unless a concrete public row is available.
