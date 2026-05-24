# Produce Class Taxonomy

`packages/server/seeds/produceClasses.sql` defines the initial produce class tree used to group unpackaged or weakly identified produce before SKU-level matching is reliable.

The seed creates the `produce_classes` table when needed and upserts classes by stable `id`. Top-level ids are broad merchandisable groups:

| Segment | Top-level classes |
| --- | --- |
| Vegetable | `vegetable-root`, `vegetable-leaf`, `vegetable-fruit`, `vegetable-cruciferous`, `vegetable-bulb`, `vegetable-allium` |
| Fruit | `fruit-pome`, `fruit-stone`, `fruit-berry`, `fruit-citrus`, `fruit-tropical` |
| Herb | `herb-leaf`, `herb-root` |
| Mushroom | `mushroom` |

Child ids use slash-separated ancestry so downstream matching can keep both a stable leaf id and its rollup path. Examples:

| Area | Classes |
| --- | --- |
| Apples | `fruit-pome/apple`, `fruit-pome/apple/granny-smith`, `fruit-pome/apple/pink-lady`, `fruit-pome/apple/royal-gala`, `fruit-pome/apple/ingrid-marie` |
| Tomatoes | `vegetable-fruit/tomato/cherry`, `vegetable-fruit/tomato/vine`, `vegetable-fruit/tomato/plum`, `vegetable-fruit/tomato/beef`, `vegetable-fruit/tomato/round` |
| Potatoes | `vegetable-root/potato/floury`, `vegetable-root/potato/floury/king-edward`, `vegetable-root/potato/waxy`, `vegetable-root/potato/waxy/mandel`, `vegetable-root/potato/new-potato` |

The initial set contains more than 80 classes across vegetables, fruits, herbs, and mushrooms. Keep additions narrow and prefer species or retailer-facing variety names that appear in Swedish grocery catalogs.
