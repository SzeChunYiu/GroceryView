# GroceryView market research: Stockholm grocery price intelligence

**Lane:** MARKET-RESEARCH / PANE 1  
**Research date:** 2026-05-16  
**Input read:** `PROPOSAL.md` v0.2 and the current `docs/research-market.md`; this artifact was reviewed and extended on 2026-05-16.

## 1. Product read-in from proposal

The proposal positions GroceryView as **TradingView for groceries** for Stockholm first, not merely a coupon/flyer app. The research below therefore evaluates competitors and data sources against these requirements:

- Store-level and chain-level grocery prices in Stockholm.
- Price history, percentiles, 52-week highs/lows, alerts and “true deal” scoring.
- Weekly basket planning for selected/favorite stores, not travel-time optimization.
- Private-label/equivalent-product handling with transparent confidence.
- Receipt, shelf-photo and community verification as a backfill and QA loop.
- Grocery indices: Stockholm grocery/category/chain/store/personal basket indices.

## 2. Market context: why Stockholm is a plausible wedge

Swedish grocery retail is concentrated, which makes initial data coverage tractable but makes source dependency risk high. Axfood describes Swedish food retail as having over 3,100 stores, with ICA, Axfood and Coop together above 90% of sales; it estimates Axfood’s 2025 share at about 25% and notes discount has been the fastest-growing segment, with Willys as leading player ([Axfood market overview](https://www.axfood.com/about-axfood/market-and-trends/food-retail-in-sweden/)). ICA reports almost 1,300 stores and calls ICA Sweden the leading grocery retail actor; crucially, independent ICA retailers own and operate their own stores, which implies store-level pricing and promotion variance must be modeled rather than treated as one ICA price ([ICA Sweden annual review 2024](https://www.icagruppen.se/en/annual-report-2024/our-businesses/ica-sweden/)).

The macro backdrop is unusually favorable for a consumer price-intelligence product in May 2026. Statistics Sweden reported on 2026-05-13 that food and non-alcoholic beverage prices fell 5.5% in April 2026 versus March and 5.7% year-on-year; it also notes the food VAT cut from 12% to 6% took effect on 2026-04-01 and is expected to run through 2027-12-31 ([SCB April 2026 food prices](https://www.scb.se/pressmeddelande/matpriserna-sjonk-i-april2/)). Konsumentverket and Konjunkturinstitutet have a government assignment to monitor food prices before, during and after the VAT cut, with reports scheduled through 2028; this validates consumer and policy demand for independent price monitoring while also raising the bar for careful methodology and caveats ([Konsumentverket food-price assignment](https://www.konsumentverket.se/uppdrag-matmoms/)). The Swedish Competition Authority says Swedish grocery retail is highly concentrated and difficult for new stores to enter, and its food-industry inquiry continues to focus on weak competition and pricing transparency ([Konkurrensverket competition page](https://www.konkurrensverket.se/en/competition/), [Konkurrensverket food-industry inquiry](https://www.konkurrensverket.se/informationsmaterial/rapportlista/konkurrensverkets-genomlysning-av-livsmedelsbranschen-20232024/)). This supports a launch narrative around VAT pass-through, store-level transparency, and independent historical price verification.

Implications for GroceryView:

1. **MVP chains should be ICA, Willys, Coop, Hemköp, Lidl and City Gross**, with Mathem/Mat.se as online-only reference points if useful.
2. **Store format matters.** ICA Nära, ICA Supermarket, ICA Kvantum and ICA Maxi should not be averaged blindly; a “Stockholm ICA” price is often less meaningful than a store/format-specific observation.
3. **Private label is strategic.** ICA, Axfood/Garant/Eldorado, Coop/Xtra/Änglamark and Lidl brands are central to basket savings and equivalence logic.
4. **Discount and campaign behavior is product-market fit.** A “true deal” layer can exploit the gap between weekly offer discovery and historical validation.
5. **VAT pass-through monitoring is a timely wedge.** April 2026 created a visible price shock; GroceryView can show whether specific chains, stores and categories pass tax and wholesale changes through to actual shelf/receipt prices.

## 3. Competitor landscape

### 3.1 Sweden/Stockholm direct competitors

| Competitor | What it does today | Coverage/signals | Strengths | Gaps vs GroceryView opportunity |
|---|---|---|---|---|
| **Matpriskollen / Priskollen** | Sweden-focused app for weekly offers, store favorites, alerts, lists, and newer item scan/search price comparison. | Google Play listing checked 2026-05-16 says 100k+ downloads, 3.7 stars, updated 2026-05-13, over 300k users, favorite stores across ICA, Coop, Willys, City Gross, Ö&B, Rusta, Hemköp, Lidl etc.; it says the team enters ~200k new offers weekly from over 3,000 stores and collects millions of regular prices ([Google Play](https://play.google.com/store/apps/details?hl=sv&id=se.easyapp.matpriskollen)). TT/Sweden Herald reported in March 2025 that its regular-price check covered about 50,000 items, primarily from chain online stores, across ICA, Coop, Willys, City Gross, Hemköp and Lidl ([Sweden Herald / TT](https://swedenherald.com/article/new-app-helps-you-find-the-lowest-food-price)). Riksbank staff state the central bank has subscribed to Matpriskollen data since spring 2023 for weekly food-price indicators ([Riksbank staff memo PDF](https://www.riksbank.se/globalassets/media/rapporter/staff-memo/engelska/2024/indicators-for-short-term-forecasting.pdf)). | Strong brand awareness, nationwide offer database, alerts, shopping list workflow, validated B2B data business. | Now the strongest direct competitor because it is moving from offers into regular-price comparison. Still limited public evidence of TradingView-style historical charts, 52-week ranges, product tickers, basket indices, personal inflation, or explicit confidence/verification UX. User reviews on the listing also flag offer accuracy/list reliability risk, which supports GroceryView’s verification angle. |
| **Matspar.se** | Online grocery price comparison and basket builder. | Says it aggregates online grocery assortments, compares stores while users build a basket, claims up to 30% savings, daily price comparisons and campaign collection ([Matspar about](https://www.matspar.se/om-oss)). | Strong online basket comparison, filters for eco/certifications/allergens, independent consumer positioning. | Focuses on online shopping/basket savings rather than in-store Stockholm market terminal, historical deal validation, local store pages, or receipt/community data. |
| **Nätmat / Natmat** | Online multi-store grocery shopping and price-comparison/delivery wrapper. | Public landing page positions it as a way to shop from multiple stores and get the best prices delivered after entering a postcode ([Natmat](https://www.natmat.se/)). | Relevant because it attacks the “build one basket across stores” problem and could reduce switching friction for online shoppers. | Fulfilment/online-commerce first, not an analytics terminal. Public evidence is limited for price history, physical-store Stockholm coverage, confidence labels, deal validation, or receipt-backed personal inflation. |
| **Matmoms** | Small/public daily price tracker for ICA, Coop and Willys. | Claims 419 items, 33 stores, 9 Swedish cities, daily API collection, CSV/JSON/API access for journalists/researchers ([Matmoms](https://matmoms.se/)). | Demonstrates feasibility of daily retailer API collection and narrow-stock keeping unit (SKU) basket. Potential data/benchmark partner. | Narrow catalog and chains; unclear commercial durability/rights; no apparent consumer mobile workflow. Treat as benchmark/source lead, not a full competitor. |
| **Matbit** | Swedish grocery basket/list price-comparison app/project. | QuidBit’s product page says Matbit compares Coop, ICA, Mathem, Willys, Citygross and Hemköp in real time, with 120k+ products in database and iOS/Android apps ([Matbit / QuidBit](https://quidbit.se/food/)). | Shows that full-basket, cross-chain Swedish price comparison is technically and UX-feasible. | Current operating status and data rights need verification; public positioning is basket/list comparison, not price history, true-deal scoring, indices or receipt-backed verification. |
| **PRISSPAR** | Web-based Swedish price/offers and cheapest-basket comparison. | Public page says it gathers current prices and offers for ICA, Willys, Coop, Hemköp and City Gross, lets users select postcode/location, compare individual items and analyze the cheapest store for a shopping list ([PRISSPAR](https://www.prisspar.se/)). | Shows another active local/search-and-basket competitor; its on-page caveat about confirming final store price highlights the category’s accuracy problem. | Appears utility/SEO-first, not a full mobile market terminal. No public evidence of long-horizon history, 52-week ranges, source confidence UX, receipt verification, indices, or household budget analytics. |
| **Comparator Sverige grocery basket** | Small web weekly Stockholm basket comparison. | Week 20 2026 page compares a nine-item basket across Willys, Coop and ICA; states prices are Stockholm-based, updated every Monday, include weekly single-item offers, and may vary for smaller stores ([Comparator Sverige grocery](https://comparator.se/en/grocery)). | Very close to GroceryView’s “market report” wedge; confirms SEO/public-report demand around Stockholm grocery baskets and the 2026 VAT cut. | Extremely narrow chain/item coverage and no app/list workflow. The page’s own “indicative” caveat reinforces the need for GroceryView confidence labels and receipt/shelf verification. |
| **Rezepta Grocery Price Index** | Recipe/app-adjacent weekly grocery price index. | Public index says it compares 43 staple products across ICA, Coop, Willys, Hemköp and MatHem weekly, with a price-history chart and CSV download; methodology says prices update weekly via Matspar.se and are based on PRO 2024 basket methodology ([Rezepta Matprisindex](https://rezepta.app/en/matprisindex)). | Direct proof that “grocery index” is a discoverable consumer/SEO format in Sweden. The CSV download is useful for benchmarking methodology and basket definitions. | Index is chain-level and basket-level, not store-level or product-terminal-level. Dependence on Matspar means it is more an analytics wrapper than a data moat. |
| **Rezepta product price pages** | Broader Swedish product-price pages around recipe/planning flows. | A separate Rezepta page says it compares 21,000+ products with weekly updated prices from ICA, Coop, Willys, Hemköp and MatHem, and discloses `matspar.se` as price-data source ([Rezepta matpriser](https://rezepta.app/matpriser)). | Shows an SEO/product-search direction beyond a single index and confirms Matspar can power downstream vertical apps. | Dependency on another data provider is visible; the public experience remains price/search/recipe oriented rather than store-level history, source provenance and verification. |
| **Matpriser.nu** | Web comparison of selected online grocery baskets. | Compares Coop, MatHem, Mat.se, ICA, Hemköp and Willys; updates comparison weekly while monitoring prices; includes shipping and offers ([Matpriser comparison](https://www.matpriser.nu/jaemfoerelsen)). | SEO pages and transparent basket table; useful example of affiliate-friendly web funnel. | Not broad product search, not store-level in Stockholm beyond selected assumptions, no history/alerts/indices. |
| **eReklamblad / Tjek** | Digital flyers/offers across Scandinavia. | Site states it shows current flyers and offers, location-dependent, part of Tjek ([eReklamblad](https://ereklamblad.se/)). | Large flyer inventory, user habit around weekly deals; possible structured offer feed visible in app data. | Flyer-first, not exact regular prices or historical true-deal intelligence. Needs local-price verification. |
| **Veckans 200** | App centered on weekly offers from major chains with lists and favorite stores. | Claims household can save ~200 kr/week; covers City Gross, Coop, Hemköp, ICA and Willys; 19 kr/month after trial; favorite stores and shared shopping list ([Veckans 200](https://www.veckans200.se/)). | Paid willingness-to-pay signal for deal planning; narrow Swedish UX. | Offer/list workflow only; no public sign of regular prices, history, price terminal, receipt analytics, or indices. |
| **Smaklig** | AI meal planning from Swedish grocery campaigns. | Claims campaign integration across ICA, Coop, Hemköp, City Gross, Lidl and Willys/Costco depending language page; focuses on recipes, allergies, goals and savings ([Smaklig EN](https://smaklig.app/en)). | Adjacent job-to-be-done: “what should I cook from deals?” Could own meal-planning wedge. | It is recipe/meal-plan first, not price intelligence terminal. Potential future integration/competitive module for GroceryView meal planning. |
| **Nisse** | Swedish AI cooking assistant with price-per-portion and store comparison. | Public site says it compares ICA, Willys, Coop and Lidl and shows price per portion while building recipes/lists ([Nisse](https://www.nisse.io/)). | Confirms an adjacent recipe-to-shopping wedge with AI assistant UX. | Recipe/assistant first; no public evidence of exact product price history, Stockholm store-level price terminal, alerts, receipt analytics or grocery indices. |
| **Other micro-apps / unverified projects** | Search results and social posts show newer or smaller price-comparison, deal-sharing and recipe-to-list projects for Swedish grocery chains. | Examples often claim comparisons across ICA, Coop, Willys, Hemköp and sometimes City Gross/Mathem. | Shows the category is heating up beyond established players. | Need manual verification before relying on them. Many look early-stage; opportunity remains in trust, depth, history and UX differentiation. |

### 3.2 Retailer-owned apps are indirect competitors and data sources

Retailers already cover parts of the workflow:

- **ICA app**: favorite stores, current offers, personal offers/Stammis prices, lists, recipes, store services and mobile self-scanning ([ICA app page](https://www.ica.se/appar-och-tjanster/appen-ica/)).
- **Willys Plus / Willys app**: member offers and low-price positioning; Willys is explicitly positioned by Axfood as Sweden’s leading discount grocery chain with the ambition of Sweden’s cheapest bag of groceries ([Axfood Willys page](https://www.axfood.com/about-axfood/the-axfood-family/willys/); [Willys Plus](https://www.willys.se/Om-oss/willysplus/Willysappen)).
- **Coop, Hemköp, City Gross, Lidl apps/sites**: online ordering, offers, membership prices and store flyers.

Retailer apps are strong for **their own chain** but weak for cross-chain neutral comparison, price history, independent “deal truth,” and personal inflation. GroceryView should avoid copying a retailer app and instead become the neutral analytics layer across chains.

### 3.3 International and category inspirations

The proposal’s inspirations remain valid:

- **Keepa / CamelCamelCamel**: price history, alerts, buy/wait, historical low framing. GroceryView adaptation: exact product/store price charts and promo markers.
- **TradingView/Yahoo Finance/Bloomberg**: ticker pages, screeners, watchlists, indices, market movers. GroceryView adaptation: grocery instruments such as `ARLA-MILK-1L`, `COFFEE-STHLM-IDX`, `WILLYS-STHLM-BASKET`.
- **Flipp / KaufDA / Tokubai / eReklamblad**: local flyers and weekly deal browsing. GroceryView adaptation: convert offers into structured price observations and score them historically.
- **Yuka / Open Food Facts**: barcode/nutrition clarity. GroceryView adaptation: barcode scan should resolve product identity and price history, not just health score.
- **Bring! / AnyList**: household list collaboration. GroceryView adaptation: list items become monitored market instruments with budget/deal intelligence.
- **Too Good To Go / Karma / Olio**: surplus and expiry deals. GroceryView adaptation: optional “reduced food near me” module; not core price history.

## 4. Data sourcing options

### 4.1 Source inventory and ranking

| Source type | Examples | Data useful for GroceryView | Feasibility | Legal/operational risk | Recommended use |
|---|---|---|---|---|---|
| **Licensed/partner feeds** | Retailers; Matpriskollen data; Matmoms CSV/JSON/API; possibly Matspar/Cartly or flyer providers | Regular prices, promotions, product catalog, store IDs, availability, transaction aggregates | Medium: requires business development | Low if licensed; medium dependency risk | Best long-term path for scalable reliable product. Start outreach early. |
| **Retailer public e-commerce pages and app/web JSON** | ICA, Willys, Coop, Hemköp, City Gross, Lidl | Store-level online prices, regular/member prices, promotions, unit prices, product images, availability | Technically high for chains with online catalog; coverage varies | Medium/high: ToS, robots, anti-bot, database rights; prices can be online-only | MVP prototype and validation only after legal review; throttle and honor robots. Prefer “observed public prices” labels. |
| **Flyers/digital offer aggregators** | Matpriskollen, eReklamblad/Tjek, retailer weekly offer pages, PDFs | Weekly promo price, campaign period, member-only flag, store/chain coverage | High for offers | Medium: structured data may be copyrighted/licensed | Use to seed offer events; verify with retailer pages or users before scoring. |
| **User receipts** | OCR of paper/digital receipts; email receipts; shared self-scan history | Actual paid price, discount line, quantities, store/date/time, basket composition | Medium; requires OCR/matching and user trust | Medium/high GDPR and consent requirements | Core differentiator and data moat; use explicit consent, minimization, retention controls. |
| **Shelf photos/community verification** | User shelf tags, promo signs, store audits | In-store price verification, member price flags, out-of-stock, local variants | Medium | Medium moderation/privacy burden | Best for confidence scoring in dense Stockholm areas. Gamify but avoid incentives that encourage bad data. |
| **Manual sentinel basket audits** | 200 canonical items across 20–40 Stockholm stores | High-quality baseline, early history, QA set | Medium labor cost, high quality | Low | Strong MVP fallback; create weekly “Stockholm core basket” and audit popular stores. |
| **Product identity/catalog databases** | GS1 Sweden Validoo, Open Food Facts, Livsmedelsverket, retailer product pages | GTIN/EAN, product name, size, image, nutrition, ingredients, allergens, category | Medium | Low/medium depending license | Use as catalog layer; not a price source. Combine with product matching. |
| **Public statistics/benchmarks** | SCB CPI, Livsmedelsverket, Swedish Consumer Agency budgets if needed | Inflation benchmarks, basket methodology, category taxonomy | High | Low | Use to calibrate indices and content, not as item-level app prices. |
| **Public basket studies and surveys** | PRO annual basket survey, Swedbank/Sparbankerna basket, Testfakta/media one-off baskets, Konsumentverket household-cost budgets | Canonical basket design, historical comparison points, store/format selection, public-interest methodology | High for benchmarking; low for live data | Low for citation; medium if reusing detailed product lists without permission | Use to design GroceryView’s sentinel basket and explain methodology, not as live prices. |

### 4.2 Retailer-web sourcing feasibility notes

Observed `robots.txt` on 2026-05-16:

- `willys.se`: disallows cart/account/order/search paths, crawl-delay 10 seconds and visit-time 04:00–08:45 UTC; sitemap allowed.
- `hemkop.se`: similar Axfood pattern: checkout/cart/account/order paths disallowed, crawl-delay 10 seconds and visit-time 04:00–08:45 UTC; sitemap allowed.
- `coop.se`: disallows account, checkout, search/filter/sort and certain recipe query pages; allows general pages.
- `ica.se`: broad sitemap access; disallows some AJAX response endpoints and has specific GPTBot/meta-externalagent restrictions for deep store/recipe patterns.
- `citygross.se`: disallows account and `/loop54/`.
- `lidl.se`: disallows search and many numeric path patterns; sitemap allowed.
- `matspar.se`: allows most pages but disallows checkout/cart/account.
- `matpriskollen.se`: explicitly disallows `/api/`, login/account/favorites and dynamic offer/product/search pages while allowing public content.

Implications:

- Do **not** build the company on hidden API scraping without counsel. It creates uptime, reputational and legal risk.
- For experiments, use small-volume, well-throttled observation; store source URL, timestamp, store ID, price type and confidence.
- Use public pages/sitemaps for discovery where allowed, but avoid disallowed search/API/account/cart/checkout paths.
- Treat retailer-online prices as **online observed prices**, not guaranteed shelf prices, unless verified by receipt/shelf photo.

### 4.3 Product/catalog sources

1. **GS1 Sweden / Validoo**: Sweden’s largest platform for structured product information. It provides product data, images, barcode/trade item quality assurance and GDSN data sharing; GS1 lists 3,250 suppliers/retailers, 300,000 products with trade item information and 100,000 quality-assured images ([GS1 Validoo](https://gs1.se/en/standards-and-services/validoo/)). GS1’s API guide says complete trade item information and images can be received from Validoo depending on the customer contract, and the developer portal says API access requires becoming a customer and OAuth authentication; retrieved GS1 information must be stored locally rather than consumed directly by the end product ([GS1 API guide](https://gs1.se/en/guides/apis-to-send-share-and-receive-information/), [GS1 developer portal](https://developer.gs1.se/api-get-started)). Good for commercial-grade identity and images, but it is a licensed catalog integration, not a price feed.
2. **Open Food Facts**: open product database/API with ingredients and nutrition and ODbL/DBCL licensing; documentation warns data is voluntary and not guaranteed accurate, with read rate limits such as 15 product requests/min/IP and 10 search requests/min/IP ([Open Food Facts API docs](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/)). Good for barcode bootstrap and community contribution; insufficient alone for Swedish catalog completeness.
3. **Open Prices by Open Food Facts**: a newer open, crowdsourced price-observation project with an API, designed around food prices worldwide; it asks contributors to attach proof such as shelf-tag or receipt photos, and third-party apps can contribute through the API ([Open Prices tutorial](https://openfoodfacts.github.io/openfoodfacts-server/api/tutorials/product-prices/), [Open Prices API docs](https://prices.openfoodfacts.org/api/docs)). Good as a supplemental open observation feed and possible publication target for GroceryView-verified prices, but Swedish coverage must be measured before relying on it.
4. **Livsmedelsverket food database**: official Swedish nutrition database/search; current public pages state the database version and require attribution, and the annual report says the database has over 6,000 foods with almost 2,500 available on the website plus an API for open data ([search site](https://soknaringsinnehall.livsmedelsverket.se/), [2024 annual report snippet](https://www.livsmedelsverket.se/globalassets/publikationsdatabas/arsredovisningar/livsmedelsverkets-arsredovisningen-2024.pdf)). Good for generic nutrition/category enrichment and Swedish terms; not SKU-specific enough for exact products.
5. **Retailer catalogs**: necessary for store-specific assortments, private label and online product IDs. Use as observed/derived data with source tracking and legal review.

### 4.4 Benchmark basket methodology sources

GroceryView should not invent its first “Stockholm core basket” in a vacuum. Useful methodological anchors:

- **PRO annual price survey**: local PRO pages report large annual store samples and basket totals; for example, a Stockholm page says 742 stores were checked nationally in 2025, including 128 in Stockholm, and lists concrete Stockholm-area store basket totals ([PRO Stockholm basket survey page](https://pro.se/distrikt/stockholm/kommun/stockholm/pro-stureby/prisundersokningen---matkassen)). This is good for store-format sampling and public familiarity, even if only annual and not SKU-level live data.
- **Swedbank/Sparbankerna basket**: a February 2026 report says 200 food articles were collected from 30 stores across six price areas using retailer websites, covering ICA Maxi, ICA Kvantum, Stora Coop, Willys and City Gross; it intentionally excludes Lidl, Hemköp and smaller stores to ensure shared assortment ([Swedbank basket PDF](https://mb.cision.com/Public/67/4308671/981ff1456d6153df.pdf)). This is a strong reference for a canonical product set and a warning that strict cross-chain comparability can exclude important Stockholm formats.
- **Konsumentverket household-cost budgets**: useful for household-size basket weighting and budget UX, but too aggregated for product-level price truth ([Konsumentverket food cost page](https://www.konsumentverket.se/ekonomi/vad-kostar-maten-varje-manad/)).
- **Svenskt Kvalitetsindex 2026**: not a price source, but its grocery-sector report flags customer sensitivity to unclear campaigns, ordinary prices framed as deals, and bulk offers that exclude single/elderly households ([SKI grocery 2026 PDF](https://www.kvalitetsindex.se/wp-content/uploads/2026/04/ski-dagligvaruhandel-2026.pdf)). This supports GroceryView features for “true deal” labels, single-unit comparisons and household-fit scoring.

### 4.5 Price-history and index data methodology

Statistics Sweden’s CPI methodology supports the idea that grocery price intelligence should combine register/scanner data, web collection and careful product matching. SCB notes modern CPI price collection relies heavily on automated digital sources, weekly deliveries from enterprises and web scraping; in 2013, much food-retail shop price collection was replaced by weekly comprehensive register data from major supermarket chains. SCB also notes scanner data is barcode-level and quantity/turnover-based, and highlights package-size changes/shrinkflation as a measurement issue ([SCB new CPI data sources PDF](https://www.scb.se/en/finding-statistics/statistics-by-subject-area/prices-and-economic-trends/price-statistics/consumer-price-index-cpi/produktrelaterat/more-information/new-data-sources-in-the-cpi/)).

For GroceryView this means:

- Store `price_observation` at **barcode/product-store-date-price-type-source** level.
- Track package size and unit price separately to detect shrinkflation.
- Separate regular, campaign, member, app-only, multi-buy, online and receipt-paid prices.
- Use chain/store/category/product confidence weights; do not collapse estimates and verified observations into one line.
- For indices, start equal-weighted across canonical products; later use receipt-derived or partner transaction weights.

## 5. Recommended MVP data strategy for Stockholm

### Phase 0: Legal/data architecture gate

- Confirm legal posture on Swedish/EU database rights, retailer ToS, robots, and acceptable use of public prices.
- Implement source provenance from day one: `source_url`, `source_type`, `observed_at`, `store_id`, `price_type`, `confidence`, `raw_snapshot_hash`.
- Design GDPR flows for receipt/photo data: explicit consent, purpose limitation, ability to delete, OCR redaction of payment card/member IDs where possible.

### Phase 1: Narrow, high-confidence core basket

Launch with a **canonical Stockholm basket of ~200–500 products**:

- Staples: milk, butter, cheese, eggs, coffee, bread, rice/pasta, oats, chicken, minced meat, bananas, apples, tomatoes, frozen vegetables, diapers, toilet paper, detergent.
- Include exact branded products plus private-label equivalents with matching confidence.
- Cover 20–40 Stockholm-area stores first: Willys, Lidl, ICA Maxi/Kvantum/Supermarket/Nära, Coop/Stora Coop, Hemköp, City Gross where practical.
- Combine: public retailer observations + flyer offers + manual audits + user receipt/photo verification.
- Output: product ticker pages, price history, favorite-store watchlist, deal score, weekly “Stockholm Grocery Market” report.

### Phase 2: Scale through user and partner loops

- Add receipt import and shelf-photo verification prompts for products already in user watchlists.
- Recruit early users in dense districts: Södermalm, Vasastan, Kungsholmen, Östermalm, Solna/Sundbyberg, Kista, Liljeholmen/Årsta, Hammarby Sjöstad, Sickla/Nacka.
- Contact Matmoms for dataset/API access and Matpriskollen/Matspar for partnership or benchmarking.
- Build retailer-neutral public SEO pages for the canonical basket and key products, but keep exact live store coverage honest with confidence labels.

### Phase 3: Advanced market terminal

- Expand to long-tail SKUs via barcode and receipt-driven demand.
- Add indices: `STHLM-GROCERY-IDX`, `STHLM-COFFEE-IDX`, `WILLYS-STHLM-BASKET`, `ICA-NARA-PRICELEVEL`.
- Add “deal truth”: current price vs 30/90/365-day history, local percentile, unit-price comparison, regular-price baseline, and source confidence.
- Add private-label smart swaps and “same manufacturer/equivalent” only with transparent evidence.

## 6. Positioning opportunities and gaps to exploit

1. **Trust and verification**: Existing apps help find offers; GroceryView should prove whether the offer is actually good.
2. **Price history UX**: Bring Keepa/TradingView visual grammar to groceries; no Swedish competitor is publicly claiming a deep market-terminal experience.
3. **Store-level truth**: Stockholm users often care about their 3–6 realistic stores. Build personal market scopes instead of generic “cheapest in Sweden.”
4. **Private label intelligence**: Current comparison tools struggle with “same enough” products. A confidence-scored equivalence graph is a durable moat.
5. **Receipt-powered personal inflation**: Retailers have purchase history but only within their own ecosystem; GroceryView can be cross-chain if users trust it.
6. **Transparent source confidence**: Mark exact shelf-verified, receipt-paid, online-observed, promo-only and estimated prices differently.
7. **VAT-cut/accountability reports**: In 2026–2027, publish category/store dashboards showing observed prices before/after the 2026-04-01 food VAT cut. This is timely, SEO-friendly, and aligns with public concern about pass-through without requiring a full long-tail catalog on day one.

## 7. Key risks

- **Data rights and scraping fragility:** Hidden retailer APIs may change or be blocked; robots/ToS constraints vary. Mitigate with licensed feeds, public-source compliance, caching discipline and manual/user verification.
- **Public-policy sensitivity:** Price comparison can be framed as pro-consumer transparency, but retailer claims around VAT pass-through or margins should be evidence-backed and carefully worded. Mitigate with source provenance, confidence intervals, and legal review before publishing accusatory rankings.
- **Online vs in-store mismatch:** E-commerce prices may diverge from shelf prices. Mitigate with labels and receipts/shelf photos.
- **ICA decentralization:** Independent retailers create local variance. Mitigate with store-level models and ICA format segmentation.
- **Product matching errors:** Size changes, multipacks, private label and regional assortment can corrupt history. Mitigate with GTIN, unit price, package-size tracking and human QA for canonical basket.
- **Member/personalized prices:** Member and personalized offers cannot be represented as universal. Mitigate by explicit price types and user-specific views.
- **User privacy:** Receipts reveal household behavior. Mitigate with privacy-by-design and avoid ad targeting with receipt data, consistent with the proposal’s trust principle.

## 8. Immediate next actions for product/research lanes

1. Create a `stores` seed list for Stockholm: chain, format, address, lat/lon, online availability, source URL.
2. Define canonical basket v0.1: 200 products/categories with exact-match and equivalent-match rules.
3. Prototype `price_observations` schema with price type and confidence labels.
4. Contact/data outreach list:
   - Matmoms: dataset/API access for Stockholm daily observations.
   - GS1 Sweden/Validoo: eligibility and pricing for product/catalog receiver access.
   - Matpriskollen and Matspar: partnership/data licensing/affiliate options.
   - Open Food Facts/Open Prices: Swedish coverage snapshot and contribution/licensing compatibility.
   - Retailer press/partner contacts for public-interest price transparency pilots.
5. Run a 4-week manual audit in 10 Stockholm stores to validate price variance and build initial historical charts.
6. Build a VAT-pass-through mini-report for the canonical basket using April–June 2026 observations, with explicit caveats for seasonality and source confidence.

## 9. Source links

- Axfood, Swedish food retail market: https://www.axfood.com/about-axfood/market-and-trends/food-retail-in-sweden/
- ICA Sweden annual review 2024: https://www.icagruppen.se/en/annual-report-2024/our-businesses/ica-sweden/
- SCB April 2026 food prices and VAT-cut context: https://www.scb.se/pressmeddelande/matpriserna-sjonk-i-april2/
- Swedish Competition Authority competition overview: https://www.konkurrensverket.se/en/competition/
- Swedish Competition Authority food-industry inquiry 2023–2024: https://www.konkurrensverket.se/informationsmaterial/rapportlista/konkurrensverkets-genomlysning-av-livsmedelsbranschen-20232024/
- Konsumentverket food-price/VAT monitoring assignment: https://www.konsumentverket.se/uppdrag-matmoms/
- Matpriskollen Google Play listing: https://play.google.com/store/apps/details?hl=en-US&id=se.easyapp.matpriskollen
- Sweden Herald / TT on Matpriskollen regular price check: https://swedenherald.com/article/new-app-helps-you-find-the-lowest-food-price
- Riksbank staff memo mentioning Matpriskollen data: https://www.riksbank.se/globalassets/media/rapporter/staff-memo/engelska/2024/indicators-for-short-term-forecasting.pdf
- Matspar about: https://www.matspar.se/om-oss
- Nätmat: https://www.natmat.se/
- Matmoms: https://matmoms.se/
- Matbit / QuidBit: https://quidbit.se/food/
- PRISSPAR: https://www.prisspar.se/
- Comparator Sverige grocery basket: https://comparator.se/en/grocery
- Rezepta Grocery Price Index: https://rezepta.app/en/matprisindex
- Rezepta matpriser product pages: https://rezepta.app/matpriser
- Matpriser comparison: https://www.matpriser.nu/jaemfoerelsen
- eReklamblad: https://ereklamblad.se/
- Veckans 200: https://www.veckans200.se/
- Smaklig: https://smaklig.app/en
- Nisse: https://www.nisse.io/
- ICA app: https://www.ica.se/appar-och-tjanster/appen-ica/
- Willys Plus: https://www.willys.se/Om-oss/willysplus/Willysappen
- GS1 Sweden Validoo: https://gs1.se/en/standards-and-services/validoo/
- GS1 Sweden API guide: https://gs1.se/en/guides/apis-to-send-share-and-receive-information/
- GS1 Sweden developer portal: https://developer.gs1.se/api-get-started
- Open Food Facts API docs: https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/
- Open Prices tutorial: https://openfoodfacts.github.io/openfoodfacts-server/api/tutorials/product-prices/
- Open Prices API docs: https://prices.openfoodfacts.org/api/docs
- Livsmedelsverket nutrition search: https://soknaringsinnehall.livsmedelsverket.se/
- PRO Stockholm basket survey page: https://pro.se/distrikt/stockholm/kommun/stockholm/pro-stureby/prisundersokningen---matkassen
- Swedbank/Sparbankerna basket report February 2026: https://mb.cision.com/Public/67/4308671/981ff1456d6153df.pdf
- Konsumentverket food-cost budgets: https://www.konsumentverket.se/ekonomi/vad-kostar-maten-varje-manad/
- Svenskt Kvalitetsindex grocery 2026: https://www.kvalitetsindex.se/wp-content/uploads/2026/04/ski-dagligvaruhandel-2026.pdf
- SCB CPI new data sources PDF: https://www.scb.se/en/finding-statistics/statistics-by-subject-area/prices-and-economic-trends/price-statistics/consumer-price-index-cpi/produktrelaterat/more-information/new-data-sources-in-the-cpi/
- Robots checked: https://www.willys.se/robots.txt, https://www.ica.se/robots.txt, https://www.coop.se/robots.txt, https://www.hemkop.se/robots.txt, https://www.citygross.se/robots.txt, https://www.lidl.se/robots.txt, https://www.matspar.se/robots.txt, https://matpriskollen.se/robots.txt
