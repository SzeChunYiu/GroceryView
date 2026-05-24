export const categoryCanonicalMetadataCases = [
  {
    name: 'preserve locale and currency',
    slug: 'pantry',
    searchParams: { lang: 'sv', currency: 'sek' },
    expectedCanonical: '/categories/pantry?lang=sv&currency=SEK'
  },
  {
    name: 'normalize currency casing and drop unsupported search params',
    slug: 'dairy',
    searchParams: { lang: 'EN', currency: 'usd', page: '2', sort: 'desc' },
    expectedCanonical: '/categories/dairy?lang=en&currency=USD'
  }
];

export const searchCanonicalMetadataCases = [
  {
    name: 'normalize casing and preserve query, locale and currency',
    searchParams: { q: 'coffee roast', lang: 'sv', currency: 'sek' },
    expectedCanonical: '/search?q=coffee+roast&lang=sv&currency=SEK'
  },
  {
    name: 'drop unsupported search filters',
    searchParams: { q: 'milk', lang: 'en', currency: 'eur', filter: 'new' },
    expectedCanonical: '/search?q=milk&lang=en&currency=EUR'
  }
];
