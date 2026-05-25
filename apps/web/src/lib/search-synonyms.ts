export type GrocerySearchSynonymGroup = {
  canonical: string;
  terms: string[];
  intent: 'product' | 'category' | 'dietary';
};

export const grocerySearchSynonymGroups: GrocerySearchSynonymGroup[] = [
  {
    canonical: 'yogurt',
    terms: ['yoghurt', 'yogurt', 'grekisk yoghurt', 'greek yogurt', 'fil', 'filmjolk', 'filmjölk', 'sour milk'],
    intent: 'product'
  },
  {
    canonical: 'diapers',
    terms: ['diapers', 'nappies', 'blöjor', 'blojor', 'baby pants', 'toddler pants', 'pampers', 'libero'],
    intent: 'product'
  },
  {
    canonical: 'milk',
    terms: ['milk', 'mjölk', 'mjolk', 'mjoelk', 'melk', 'dairy milk', 'arla mjölk'],
    intent: 'product'
  },
  {
    canonical: 'coffee',
    terms: ['coffee', 'kaffe', 'java', 'bryggkaffe', 'zoegas', 'zoégas', 'zogas'],
    intent: 'product'
  },
  {
    canonical: 'gluten-free',
    terms: ['gluten-free', 'glutenfri', 'gluten free', 'celiac', 'coeliac'],
    intent: 'dietary'
  },
  {
    canonical: 'lactose-free',
    terms: ['lactose-free', 'laktosfri', 'lactose free', 'mjölkfri', 'milk free'],
    intent: 'dietary'
  }
];

export function normalizeSynonymText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/Å/g, 'a')
    .replace(/Ä/g, 'a')
    .replace(/Ö/g, 'o')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function includesTerm(query: string, term: string): boolean {
  if (!term) return false;
  return query === term || query.includes(term) || query.split(' ').includes(term);
}

export function semanticSynonymsForQuery(query: string): Array<{ canonical: string; matchedTerm: string; terms: string[]; intent: GrocerySearchSynonymGroup['intent'] }> {
  const normalizedQuery = normalizeSynonymText(query);
  if (!normalizedQuery) return [];

  return grocerySearchSynonymGroups.flatMap((group) => {
    const matchedTerm = group.terms.map(normalizeSynonymText).find((term) => includesTerm(normalizedQuery, term));
    if (!matchedTerm) return [];
    return [{
      canonical: group.canonical,
      matchedTerm,
      terms: group.terms,
      intent: group.intent
    }];
  });
}
