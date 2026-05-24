# Variety-store overlap categories

GroceryView only tracks variety-store SKUs that overlap normal grocery or basic pharmacy missions. Everything outside this whitelist is ignored so cosmetics, fashion, electronics, gifts, and other non-grocery assortment do not dilute grocery comparisons.

## Whitelist

- `personal_care` — shampoo, soap, deodorant, toothpaste, and related repeat household basics.
- `household_cleaning` — detergents, dish soap, surface cleaners, and laundry basics.
- `paper_goods` — toilet paper, tissues, paper towels, napkins, and similar consumables.
- `batteries` — common household batteries often bought with grocery trips.
- `otc_basic` — basic over-the-counter pharmacy products appropriate for grocery/pharmacy overlap.
- `baby_care` — diapers, wipes, baby toiletries, and adjacent repeat needs.
- `pet_food` — pet food and treats that overlap supermarket baskets.
- `candy_snacks` — candy, chocolate, gum, chips, and similar grocery snacks.
- `beverages_non_alcohol` — water, soda, juice, energy drinks, coffee drinks, and other non-alcohol beverages.

All other category IDs are ignored by variety-store ingestion until explicitly added here with a grocery/pharmacy overlap reason.
