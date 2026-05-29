export type SeoGuide = {
  slug: string;
  title: string;
  description: string;
  canCompare: readonly string[];
  cannotClaim: readonly string[];
  examples: readonly { label: string; href: string; detail: string }[];
  faq: readonly { question: string; answer: string }[];
};

export const seoGuides: readonly SeoGuide[] = [
  {
    slug: 'compare-grocery-prices',
    title: 'How to compare grocery prices without guessing',
    description: 'Use GroceryView category, product, and store evidence to compare current best known grocery prices before you shop.',
    canCompare: ['source-backed product price rows', 'unit prices and package sizes when normalized', 'category and chain context with freshness labels'],
    cannotClaim: ['live shelf stock at every branch', 'future prices', 'private loyalty pricing without source evidence'],
    examples: [
      { label: 'Search products', href: '/search', detail: 'Start with product search and evidence cards.' },
      { label: 'Browse categories', href: '/browse', detail: 'Drill into category pages that have verified rows.' },
      { label: 'Read methodology', href: '/methodology', detail: 'Understand confidence, freshness, and hidden claims.' }
    ],
    faq: [
      { question: 'Why does GroceryView say current best known price?', answer: 'The wording keeps the claim tied to visible source rows and avoids pretending every shelf is live.' },
      { question: 'When is a page not indexed?', answer: 'Thin or empty filter combinations stay noindex until verified data and helpful copy exist.' }
    ]
  },
  {
    slug: 'real-grocery-deals',
    title: 'How GroceryView separates real deals from noisy discounts',
    description: 'Deal pages explain why a price looks useful, which rows support it, and what confidence limits still apply.',
    canCompare: ['visible deal rows', 'price-history or nearby comparison support', 'chain and category filters that canonicalize correctly'],
    cannotClaim: ['guaranteed availability', 'personalized discount eligibility', 'unsupported cheapest-ever claims'],
    examples: [
      { label: 'Open deals', href: '/deals', detail: 'Use general deal radar for indexable discovery.' },
      { label: 'Open market view', href: '/market', detail: 'See category and chain context behind deal signals.' },
      { label: 'Data sources', href: '/data-sources', detail: 'Check which source rows support public claims.' }
    ],
    faq: [
      { question: 'Are filtered deal URLs indexed?', answer: 'No. Noisy filters canonicalize to /deals unless curated and useful.' },
      { question: 'Can ads change deal ranking?', answer: 'Deal methodology keeps sponsored placement separate from price evidence.' }
    ]
  },
  {
    slug: 'fuel-prices-sweden',
    title: 'Fuel prices in Sweden: what GroceryView can and cannot show',
    description: 'Fuel pages separate operator-level price observations from fuel station location evidence.',
    canCompare: ['operator-level fuel price rows', 'fuel grade availability tags', 'OSM/Overpass station locations'],
    cannotClaim: ['live station pump price without station source evidence', 'fuel availability at a pump', 'route-specific savings without user-confirmed context'],
    examples: [
      { label: 'Fuel overview', href: '/fuel', detail: 'Compare grade-level operator observations.' },
      { label: 'Fuel stations', href: '/fuel/stations', detail: 'Inspect location-only station evidence.' },
      { label: 'Map fuel layer', href: '/map?domain=fuel', detail: 'Selected map states canonicalize to stable fuel pages.' }
    ],
    faq: [
      { question: 'Why not show station pump prices?', answer: 'Station pages do not include station-specific prices unless that exact evidence is available.' },
      { question: 'Are fuel stations structured data?', answer: 'Yes, station detail pages can emit GasStation JSON-LD for source-backed address and geo fields only.' }
    ]
  },
  {
    slug: 'otc-pharmacy-price-comparison',
    title: 'OTC pharmacy price comparison with exact EAN boundaries',
    description: 'Pharmacy pages compare public OTC catalog rows by exact EAN and avoid medical, prescription, and stock claims.',
    canCompare: ['public OTC catalog rows', 'exact EAN matches across pharmacies', 'visible price and freshness evidence'],
    cannotClaim: ['medical advice', 'prescription comparison', 'stock availability unless a source says so'],
    examples: [
      { label: 'Pharmacy overview', href: '/pharmacy', detail: 'Read the OTC safety boundary.' },
      { label: 'OTC hub', href: '/pharmacy/otc', detail: 'Open source-backed OTC comparison pages.' },
      { label: 'Pharmacy search', href: '/search?domain=pharmacy', detail: 'Filtered search is noindex and canonicalized.' }
    ],
    faq: [
      { question: 'Why exact EAN?', answer: 'Exact EAN prevents mixing similar products with different strengths, sizes, or packages.' },
      { question: 'Does GroceryView give medical advice?', answer: 'No. Pharmacy copy is price and source evidence only.' }
    ]
  },
  {
    slug: 'how-groceryview-uses-confidence',
    title: 'How GroceryView uses confidence labels',
    description: 'Confidence labels explain whether a price, deal, or index claim has enough source coverage to be useful.',
    canCompare: ['row counts', 'freshness labels', 'source coverage and confidence levels'],
    cannotClaim: ['hidden data as verified', 'complete national coverage when a source is partial', 'certainty from a small sample'],
    examples: [
      { label: 'Confidence page', href: '/confidence', detail: 'Read the confidence language used in UI.' },
      { label: 'Coverage', href: '/coverage', detail: 'Inspect coverage and freshness boundaries.' },
      { label: 'Methodology', href: '/methodology', detail: 'See when scores are hidden.' }
    ],
    faq: [
      { question: 'What does low confidence mean?', answer: 'The row may still be useful, but stronger claims are downgraded or hidden.' },
      { question: 'Can confidence change?', answer: 'Yes. New source rows, stale rows, or missing fields can change confidence.' }
    ]
  },
  {
    slug: 'how-we-handle-missing-data',
    title: 'How GroceryView handles missing data',
    description: 'Missing data is shown as a boundary or empty state instead of a fabricated price, stock, or quality claim.',
    canCompare: ['visible source rows', 'explicit empty states', 'recovery links to broader pages'],
    cannotClaim: ['fake fallback prices', 'hidden private rows', 'debug pipeline fields on public pages'],
    examples: [
      { label: 'Search', href: '/search', detail: 'Zero-result recovery offers useful next actions.' },
      { label: 'Data sources', href: '/data-sources', detail: 'Public sources and blocked claims are listed.' },
      { label: 'Browse', href: '/browse', detail: 'Category pages explain when verified rows are missing.' }
    ],
    faq: [
      { question: 'Why show empty states?', answer: 'Useful empty states are better than pretending there is verified data.' },
      { question: 'Are private pages indexed?', answer: 'No. Account, settings, admin, and private watchlist states are noindex or disallowed.' }
    ]
  }
] as const;

export function findSeoGuide(slug: string) {
  return seoGuides.find((guide) => guide.slug === slug);
}
