# Produce Class: Apples

Purpose: define apple subclasses under `fruit-pome > apples` for fresh whole
apple SKUs. This class excludes juice, cider, puree, dried apple, pies, baby
food, flavour-only products, and mixed fruit baskets where apple is only one
component.

## Seeded subclasses

| Class | Belongs here | Matching notes |
| --- | --- | --- |
| `apple-granny-smith` | Green Granny Smith apples. | Match `granny smith`, including organic, loose, and multipack SKUs. |
| `apple-pink-lady` | Pink Lady and Cripps Pink retail apples. | Match `pink lady`; use `cripps pink` as a variety synonym if exposed. |
| `apple-royal-gala` | Royal Gala and Gala-family apples sold as fresh apples. | Match `royal gala`; use generic `gala` only when no more specific class is present. |
| `apple-golden-delicious` | Golden Delicious apples. | Match `golden delicious`; do not treat generic golden colour copy as enough. |
| `apple-red-delicious` | Red Delicious apples. | Match `red delicious`. |
| `apple-fuji` | Fuji apples. | Match `fuji` in a fresh apple context. |
| `apple-braeburn` | Braeburn apples. | Match `braeburn`. |
| `apple-jazz` | Jazz apples. | Match `jazz` only with apple category or apple title context. |
| `apple-honeycrisp` | Honeycrisp apples. | Match `honeycrisp` and `honey crisp`. |

## Guardrails

Use `apples` for fresh apple SKUs where no seeded variety is visible. Keep
package size, loose/per-kg form, grade, origin, and organic labels as separate
attributes.
