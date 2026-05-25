# OKQ8 SE fuel pricing quirks

Study date: 2026-05-25. Sources were limited to `okq8.se` pages.

## Source-backed findings

| Topic requested | Verifiable finding | Connector handling |
| --- | --- | --- |
| Online vs store | OKQ8 says private customers find the current fuel price on the price sign at their local OKQ8 station. The public numeric table reviewed for this connector is instead the `Priser företagskunder` page and applies to fuel bought on station by business customers. | Fuel rows are station-channel rows with `channel: store`, `customer_segment: business`, and `price_scope: national_business_station_price`. No consumer online price row is emitted because no online consumer price table was found on the reviewed OKQ8 pages. |
| Loyalty program | OK membership gives member offers at stations and annual refunds/bonuses; the member page says the digital every-sixth-purchase reward excludes fuel. The monthly station offers page showed grocery/snack member offers, not fuel litre prices. | Fuel rows set `is_member_price: false`. Station-shop member-price products are out of scope for the fuel connector. |
| Format / sub-brand | The business station-fuel table says the listed prices apply when tanking at OKQ8, Tanka, and St1 BioGas. | Fuel rows carry `format: okq8_tanka_st1_biogas_station_network`. |
| Region / store-cluster | OKQ8 states that the business station-fuel price is the same from north to south, including examples of Pajala and Nässjö, and also the same on manned and unmanned stations. Exceptions named on the page are AdBlue, vehicle gas, and alkylate petrol, where the posted pump price applies. | Fuel rows carry a national pseudo-store id, `store_id: okq8-se-national-business-station`, and `region: se-national`. |
| Subscription / membership-required pricing | No subscription price for fuel was found on the reviewed OKQ8 pages. | Fuel rows set `is_subscription_price: false`. |
| App-only / coupon-required prices | OKQ8 advertises app/member offers for station products and services, but no app-only or coupon-only fuel litre price was found. | Fuel rows set `is_coupon_price: false`. |
| Time-of-day or close-to-close clearance | The business station-fuel page says the published price applies for the whole day, 00:00-24:00. No daily clearance fuel pricing was found. | Fuel rows set `is_clearance: false`. |
| Bulk / volume pricing tiers | The reviewed fuel station table lists one per-litre business price per grade. The reviewed monthly station-offers page showed multi-buy snack/drink offers, but those are not fuel rows. | Fuel rows set `multi_buy: null`. |
| Service-counter vs packaged | The reviewed OKQ8 fuel pages did not provide a service-counter vs packaged fuel price distinction. | No counter/packaged field is emitted. |
| B2B / wholesale split | OKQ8 publishes a business-customer price table. The same page says posted station and pump prices are private-customer prices, except for AdBlue, vehicle gas, and alkylate petrol where posted pump prices apply. OKQ8 also has separate business bulk-delivery pricing and Q8Truck pricing on the same price page. | The connector explicitly labels parsed rows as business station prices and does not emit private pump, bulk-delivery, or Q8Truck rows from this parser. |

## Reviewed examples

- Business fuel prices page: the `Drivmedel på station` table lists business prices for OKQ8 GoEasy 95, OKQ8 GoEasy 98, OKQ8 GoEasy Diesel, Neste MY Förnybar Diesel (HVO100), and Etanol E85; it says the prices apply to business customers, are published on weekdays after 13:00, and apply for the whole day. Source: https://www.okq8.se/foretag/priser/
- Business/private split: the same page says business customers should use the table rather than station signs, because signs and pumps show private-customer prices, with AdBlue, vehicle gas, and alkylate petrol as named exceptions. Source: https://www.okq8.se/foretag/priser/
- National scope: the same page says the business station-fuel price is the same from north to south and on manned and unmanned stations, with the same named exceptions. Source: https://www.okq8.se/foretag/priser/
- Private fuel page: OKQ8's station-fuel page says private customers find the current fuel price on the price sign at the local OKQ8 station. Source: https://www.okq8.se/pa-stationen/drivmedel/
- Member offers: the membership page documents member offers at stations, and the monthly offers page showed member-priced station products such as Ramlösa & Imsdal at `2 för 32 kr` versus `Ej OK-medlem 2 för 37 kr`; those are store-product examples, not fuel-litre rows. Sources: https://www.okq8.se/medlem/ and https://www.okq8.se/pa-stationen/manadens-erbjudande/
