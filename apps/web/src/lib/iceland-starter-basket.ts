export type IcelandStarterBasketCategory = 'dairy' | 'bread' | 'produce' | 'meat-fish' | 'pantry' | 'hygiene';

export type IcelandStarterBasketItem = {
  id: string;
  name: string;
  category: IcelandStarterBasketCategory;
  benchmarkRole: 'staple' | 'fresh' | 'household';
  reykjavikScope: true;
  priceStatus: 'awaiting_live_iceland_observation';
};

const starterBasketGroups: Array<{
  category: IcelandStarterBasketCategory;
  benchmarkRole: IcelandStarterBasketItem['benchmarkRole'];
  items: string[];
}> = [
  {
    category: 'dairy',
    benchmarkRole: 'staple',
    items: [
      'whole milk 1 l',
      'low-fat milk 1 l',
      'plain skyr 500 g',
      'plain yogurt 1 kg',
      'butter 500 g',
      'sliced cheese 500 g',
      'cream 250 ml',
      'sour cream 180 g',
      'eggs 10 pack',
      'margarine 500 g',
      'cottage cheese 250 g',
      'lactose-free milk 1 l'
    ]
  },
  {
    category: 'bread',
    benchmarkRole: 'staple',
    items: [
      'sandwich loaf',
      'rye bread',
      'flatbread pack',
      'hot dog buns',
      'burger buns',
      'breakfast rolls',
      'crispbread',
      'tortilla wraps',
      'frozen pizza base',
      'oat biscuits',
      'wholegrain bread',
      'sweet pastry pack'
    ]
  },
  {
    category: 'produce',
    benchmarkRole: 'fresh',
    items: [
      'bananas 1 kg',
      'apples 1 kg',
      'oranges 1 kg',
      'potatoes 2 kg',
      'carrots 1 kg',
      'onions 1 kg',
      'tomatoes 500 g',
      'cucumber each',
      'lettuce head',
      'bell peppers 3 pack',
      'mushrooms 250 g',
      'frozen mixed vegetables',
      'berries frozen 500 g',
      'avocado each'
    ]
  },
  {
    category: 'meat-fish',
    benchmarkRole: 'fresh',
    items: [
      'ground beef 500 g',
      'chicken breast 1 kg',
      'pork chops 1 kg',
      'lamb mince 500 g',
      'hot dogs 10 pack',
      'bacon 200 g',
      'ham slices 200 g',
      'cod fillet 500 g',
      'salmon fillet 500 g',
      'frozen fish fingers',
      'canned tuna',
      'plant-based mince'
    ]
  },
  {
    category: 'pantry',
    benchmarkRole: 'staple',
    items: [
      'rolled oats 1 kg',
      'rice 1 kg',
      'pasta 500 g',
      'flour 2 kg',
      'sugar 1 kg',
      'coffee 500 g',
      'black tea 25 bags',
      'cooking oil 1 l',
      'tomato sauce jar',
      'canned tomatoes',
      'baked beans can',
      'breakfast cereal',
      'jam jar',
      'peanut butter jar',
      'chocolate bar',
      'crisps 200 g',
      'soft drink 2 l',
      'bottled water 1.5 l',
      'salt 1 kg',
      'frozen ready meal'
    ]
  },
  {
    category: 'hygiene',
    benchmarkRole: 'household',
    items: [
      'toilet paper 8 roll',
      'kitchen paper 2 roll',
      'dish soap 500 ml',
      'laundry detergent',
      'shampoo 250 ml',
      'toothpaste 75 ml',
      'soap bar',
      'diapers size 4',
      'baby wipes',
      'trash bags'
    ]
  }
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const icelandStarterBasketItems: IcelandStarterBasketItem[] = starterBasketGroups.flatMap((group) =>
  group.items.map((name) => ({
    id: `is-reykjavik-${group.category}-${slugify(name)}`,
    name,
    category: group.category,
    benchmarkRole: group.benchmarkRole,
    reykjavikScope: true,
    priceStatus: 'awaiting_live_iceland_observation'
  }))
);

export const icelandStarterBasketChainTargets = [
  { chainId: 'bonus', label: 'Bonus', role: 'discount benchmark' },
  { chainId: 'kronan', label: 'Kronan', role: 'discount benchmark' },
  { chainId: 'netto', label: 'Netto', role: 'discount benchmark' },
  { chainId: 'hagkaup', label: 'Hagkaup', role: 'premium benchmark' }
] as const;

export function buildIcelandStarterBasketReadiness() {
  const categoryCounts = Object.fromEntries(
    starterBasketGroups.map((group) => [group.category, group.items.length])
  ) as Record<IcelandStarterBasketCategory, number>;

  return {
    market: 'IS',
    cityScope: 'Reykjavik starter basket',
    benchmarkLabel: '80-staple parity target',
    itemCount: icelandStarterBasketItems.length,
    categoryCounts,
    chainTargets: icelandStarterBasketChainTargets,
    livePriceObservationCount: 0,
    chainIndexStatus: 'blocked_until_live_reykjavik_prices',
    confidenceLabel: 'preview taxonomy only; no Iceland prices are claimed',
    guardrail: 'This basket defines coverage targets for Reykjavik. It does not publish ISK prices, cheapest-chain claims, or nationwide Iceland coverage until live source observations pass readiness checks.'
  };
}

