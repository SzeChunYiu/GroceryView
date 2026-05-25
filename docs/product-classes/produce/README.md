# Produce Class Taxonomy

Purpose: define the seeded GroceryView produce class hierarchy used for fresh
vegetables, fruits, herbs, and mushrooms. The authoritative seed is
`packages/server/seeds/produceClasses.sql`; this directory documents matching
boundaries for families that need retailer-specific rules.

## Top-level classes

The seed starts with these stable top-level classes:

| Class | Scope |
| --- | --- |
| `vegetable-root` | Potatoes, carrots, beetroot, parsnip, celeriac, turnip, swede, radish. |
| `vegetable-leaf` | Lettuce, spinach, rocket, kale, chard, pak choi, leaf cabbage. |
| `vegetable-fruit` | Tomatoes, cucumber, peppers, courgette, aubergine, squash, avocado. |
| `vegetable-cruciferous` | Broccoli, cauliflower, cabbage, Brussels sprouts, kohlrabi. |
| `vegetable-bulb` | Fennel bulb, celery bulb, artichoke, asparagus. |
| `vegetable-allium` | Onions, shallots, garlic, leek. |
| `fruit-pome` | Apples, pears, quince. |
| `fruit-stone` | Peaches, nectarines, plums, apricots, cherries, mangoes. |
| `fruit-berry` | Strawberries, blueberries, raspberries, blackberries, currants, gooseberries, grapes. |
| `fruit-citrus` | Citrus fruit and subclasses such as orange, lemon, lime, grapefruit, pomelo. |
| `fruit-tropical` | Bananas, pineapples, melons, kiwi, passion fruit, papaya, pomegranate. |
| `herb-leaf` | Basil, parsley, coriander, dill, mint, chives, thyme, rosemary, sage, oregano. |
| `herb-root` | Ginger, turmeric, horseradish. |
| `mushroom` | Edible fresh, dried, or canned mushrooms by variety. |

## Seed shape

- `depth = 0` rows are the top-level classes above.
- Existing classifier class IDs remain available as children where possible:
  `apples`, `tomatoes`, `potatoes`, `citrus`, `herbs`, `mushrooms`, and
  `leafy-vegetables`.
- Species and variety rows use stable kebab-case IDs. Do not rename an ID after
  it has appeared in observations; add a new child row and map old IDs in
  matcher code if a split is needed.
- Pack size, loose/per-kg form, grade, country of origin, brand, and organic
  certification are attributes, not class IDs.

## Family docs

- `apples.md` covers apple variety subclasses such as `apple-granny-smith`,
  `apple-pink-lady`, and `apple-royal-gala`.
- `potatoes.md` covers floury, waxy, and new-potato classes.
- `tomato-varieties.md` covers tomato matching boundaries.
- `citrus.md` covers citrus matching boundaries.
- `mushrooms.md` covers mushroom matching boundaries.
