# Produce class taxonomy seed

`packages/server/seeds/produceClasses.sql` seeds the initial GroceryView produce
class tree. It is intentionally shallow enough for operator review while still
capturing the retail variety names that materially affect price comparison.

## Top-level families

The seed starts with these canonical top-level classes:

- `vegetable-root`
- `vegetable-leaf`
- `vegetable-fruit`
- `vegetable-cruciferous`
- `vegetable-bulb`
- `vegetable-allium`
- `fruit-pome`
- `fruit-stone`
- `fruit-berry`
- `fruit-citrus`
- `fruit-tropical`
- `herb-leaf`
- `herb-root`
- `mushroom`

Each top-level family has species-level children. High-signal retail varieties
are nested below the species when the variety is commonly priced or matched
separately: apples include `granny-smith`, `pink-lady`, `royal-gala`, `gala`,
`golden-delicious`, `red-delicious`, `jazz`, `kanzi`, and `ingrid-marie`; tomato
subclasses include `cherry`, `vine`, `plum`, `beef`, and `round`; potatoes split
into `floury`, `waxy`, and `new-potato`, with named varieties such as `king-edward`,
`bintje`, `cara`, `mandel`, and `charlotte` underneath their retail texture class.

## Matching guidance

- Keep package size, grade, origin, organic labels, and brand as attributes, not
  taxonomy classes.
- Prefer the most specific class present in the SKU name. For example,
  `Royal Gala Äpplen` maps to `apple-royal-gala`, and `Kvisttomater` maps to
  `tomato-vine`.
- Use the existing produce reference files for class-specific guardrails:
  `citrus.md`, `tomato-varieties.md`, and `mushrooms.md`.
