# Cross-chain savings study

Evidence source: `apps/web/src/lib/axfood-products.ts`, generated from Willys and Hemköp public search endpoints retrieved 2026-05-20/21. The rows below cite the product `code`/`slug` from that observed dataset and use only the captured SEK prices in the row. Percentage gap is the dataset `spreadPct`: `(higher price - lower price) / lower price`.

## Highest observed switching opportunities

| Scenario | Observed row | Lower chain | Higher chain | Absolute gap | Observed gap |
| --- | --- | ---: | ---: | ---: | ---: |
| Organic pantry pasta basket: Garant Eko Makaroner Pasta 500g | `101302991_ST` / `makaroner-pasta-101302991-st` | Willys 12.20 SEK | Hemköp 17.93 SEK | 5.73 SEK | 47.0% |
| Breakfast oats: Axa Havregryn Extra Fylliga 825g | `101758934_ST` / `havregryn-extra-fylliga-101758934-st` | Willys 18.83 SEK | Hemköp 25.50 SEK | 6.67 SEK | 35.4% |
| Sweetener/top-up shop: Landskaphonung Svensk Honung 425g | `101550069_ST` / `svensk-honung-101550069-st` | Willys 59.52 SEK | Hemköp 80.39 SEK | 20.87 SEK | 35.1% |
| Condiment basket: Kavli Original Amerikansk Dressing 230g | `100451967_ST` / `original-amerikansk-dressing-100451967-st` | Willys 16.90 SEK | Hemköp 22.66 SEK | 5.76 SEK | 34.1% |
| Small pantry staples: Jozo Salt med Jod Extra Fint 125g | `100454982_ST` / `salt-med-jod-extra-fint-100454982-st` | Willys 7.09 SEK | Hemköp 9.41 SEK | 2.32 SEK | 32.7% |
| Crispbread/snack filler: Göteborgs Smörgåsrån Vete 170g | `100053344_ST` / `sm-rg-sr-n-vete-100053344-st` | Willys 12.20 SEK | Hemköp 16.04 SEK | 3.84 SEK | 31.5% |

## Interpretation

- The largest verified opportunities in the current bundled data are conventional grocery switches from Hemköp to Willys, especially shelf-stable pantry items. The study should not generalize beyond Willys/Hemköp because those are the only chains in these cited rows.
- The biggest absolute single-row gap in this sample is Landskaphonung Svensk Honung: 20.87 SEK lower at Willys than Hemköp.
- The highest percentage gap is Garant Eko Makaroner Pasta: the Hemköp row is 5.73 SEK above the Willys row, equal to a 47.0% gap on the Willys base price.
- No OTC pharmacy claim is made here: the repository snapshot used for this study does not include cited Apohem, DocMorris, or Apoteket observation rows in the scoped evidence file.

## Guardrails

- These rows are observed catalogue/search rows, not proof of shelf availability in every branch.
- Member-only, delivery fees, and basket minimums are not included unless they appear in the cited row.
- Treat each row as a switching prompt to verify in the retailer app before checkout, not as a permanent price ranking.
