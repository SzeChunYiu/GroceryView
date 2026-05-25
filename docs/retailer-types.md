# Retailer Types

`retailer_type` describes the primary retail lane for a chain. Product comparison rows use it for badges, filtering, and tie-break context when the same SKU appears outside a conventional grocery chain.

The canonical TypeScript vocabulary lives in `packages/core/src/types/chain.ts`.

## Base Types

| Type | Badge label | Use when |
| --- | --- | --- |
| `grocery` | Grocery | Full-range grocery chains and supermarkets. |
| `pharmacy` | Pharmacy | Pharmacies carrying regulated pharmacy goods and adjacent health products. |
| `fuel` | Fuel | Fuel stations where the primary retail lane is fuel. |
| `convenience` | Convenience | Convenience stores and kiosks with a limited everyday assortment. |
| `variety` | Variety | General variety retailers with broad non-food and selected grocery overlap. |
| `cosmetics` | Cosmetics | Cosmetics and beauty retailers with personal-care overlap. |
| `household` | Household | Household, DIY, auto, and home-goods retailers with grocery-adjacent consumables. |
| `online_marketplace` | Online marketplace | Online-first marketplaces that aggregate seller or surplus inventory. |

## Specialty Types

| Type | Badge label | Use when |
| --- | --- | --- |
| `ethnic_asian` | Asian grocery | Pan-Asian or East/Southeast Asian grocery specialists. |
| `ethnic_polish_eastern_european` | Polish and Eastern European grocery | Polish, Baltic, Balkan, Slavic, or broader Eastern European grocery specialists. |
| `ethnic_middle_eastern` | Middle Eastern grocery | Middle Eastern, Turkish, Persian, Levantine, or Arab grocery specialists. |
| `ethnic_indian_south_asian` | Indian and South Asian grocery | Indian, Pakistani, Bangladeshi, Sri Lankan, Nepali, or broader South Asian grocery specialists. |
| `ethnic_latin` | Latin American grocery | Latin American, Central American, South American, or Caribbean grocery specialists. |
| `ethnic_african` | African grocery | African or Afro-Caribbean grocery specialists. |
| `health_food` | Health food | Health-food, supplements, natural food, and wellness grocery specialists. |
| `kosher_halal` | Kosher and halal grocery | Kosher, halal, or religious dietary-specialist grocery retailers. |

## Selection Rules

Use the most specific stable type backed by the source. Do not infer ethnicity from product names alone if the retailer presents itself as a general grocery, pharmacy, or variety chain.

When a retailer spans multiple cuisines, prefer the broader type that matches the public positioning. For example, use `ethnic_asian` for pan-Asian supermarkets and `ethnic_indian_south_asian` only when the source positions the chain around South Asian groceries.

Use `kosher_halal` for dietary-law specialists when that is the primary chain identity. Use `ethnic_middle_eastern`, `ethnic_indian_south_asian`, or another regional type when halal/kosher items are only one part of a broader regional grocery assortment.
