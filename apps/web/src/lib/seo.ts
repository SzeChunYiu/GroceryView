import type { Metadata } from 'next';

export const siteUrl = 'https://grocery-web-mu.vercel.app';
export const siteName = 'GroceryView';

const defaultDescription = 'Verified Swedish grocery price intelligence with product tickers, chain comparisons, store coverage, and confidence-labelled savings signals.';
const localeNegotiatedCurrentRouteCaveat = 'Locale-negotiated current route hreflang alternates share the canonical URL until native route translations exist beyond /sv and /en.';

type RouteMetadataConfig = {
  path: string;
  title: string;
  description: string;
  noIndex?: boolean;
  imagePath?: string;
  imageAlt?: string;
};

type ProductSeoInput = {
  slug: string;
  name: string;
  category?: string;
  lowestPrice?: number;
  priceMedian?: number;
  observationCount?: number;
  brands?: string;
  brand?: string;
};

type StoreSeoInput = {
  slug: string;
  name: string;
  brand: string;
  city?: string;
  district?: string;
};

export const routeMetadataCatalog = {
  '/': {
    title: 'GroceryView verified grocery snapshot',
    description: 'Verified Sweden grocery price, product browsing, fresh OpenPrices observations, source route mapping, catalogue savings, map chain index signals, and gated feature readiness.'
  },
  '/account': {
    title: 'Account and alert controls | GroceryView',
    description: 'Account, alert, and private grocery records are gated until a verified production session is present.',
    noIndex: true
  },
  '/account/profile': {
    title: 'Account profile evidence gate | GroceryView',
    description: 'Verified account profile metadata is withheld in the static build unless production authentication returns a real session.',
    noIndex: true
  },
  '/basket-ideas': {
    title: 'Basket ideas and import contracts | GroceryView',
    description: 'Plan student staples, basket imports, retailer handoff support, and verified account-bound basket review guardrails.'
  },
  '/basket': {
    title: 'Cross-chain cheapest basket calculator | GroceryView',
    description: 'Add verified grocery products and compare the cheapest complete chain basket with a split basket built from current DB-backed price rows.'
  },
  '/items': {
    title: 'Item detail lookup | GroceryView',
    description: 'Open crawlable item entry points backed by verified product slugs, source evidence, and canonical GroceryView product metadata.'
  },
  '/search': {
    title: 'Product search | GroceryView',
    description: 'Search verified grocery products with crawlable category, dietary, chain, price, stock, and confidence filters.'
  },
  '/catalogue-savings': {
    title: 'Matched catalogue savings ledger | GroceryView',
    description: 'Compare matched Willys and Hemkop catalogue rows with savings totals, source caveats, and chain-level confidence.'
  },
  '/categories': {
    title: 'Verified grocery category coverage | GroceryView',
    description: 'Explore category quality, category deal leaders, OpenPrices depth, and verified dietary aisle coverage across Swedish grocery rows.'
  },
  '/chain-coverage': {
    title: 'Willys and Hemkop category coverage | GroceryView',
    description: 'Inspect verified chain category coverage, matched products, source confidence, and per-category savings boundaries.'
  },
  '/chain-index': {
    title: 'Swedish grocery chain price index | GroceryView',
    description: 'Track chain price indices, brand-tier gaps, and matched-basket refinements on a 100-centred confidence-labelled scale.'
  },
  '/widgets/grocery-index-ticker': {
    title: 'Embeddable Grocery Index ticker | GroceryView',
    description: 'Embed a compact 100-centred Swedish grocery chain index ticker with verified source confidence and matched-basket observations.'
  },
  '/compare': {
    title: 'Compare grocery prices across chains | GroceryView',
    description: 'See matched Willys and Hemkop products, cheapest-chain highlights, catalogue savings, and real cross-chain price spreads.'
  },
  '/coupon-stacks': {
    title: 'Coupon stack evidence gate | GroceryView',
    description: 'Coupon stacking is blocked from public rendering until verified production coupon and retailer records are available.'
  },
  '/cookies': {
    title: 'Cookie policy and consent settings | GroceryView',
    description: 'Read GroceryView cookie categories, IAB TCF v2.2 consent signals, Google Consent Mode v2 defaults, and non-personalised ad guardrails.'
  },
  '/data-sources': {
    title: 'GroceryView source coverage and claim ledger',
    description: 'Audit every public source, route map, freshness badge, allowed claim, and blocked claim behind the grocery price terminal.'
  },
  '/deals': {
    title: 'Verified grocery deal radar | GroceryView',
    description: 'Find expiry deals, single-portion deals, lunchbox deals, and trusted deal opportunities from visible source-backed rows.'
  },
  '/expiry-deals': {
    title: 'Near-expiry grocery deal radar | GroceryView',
    description: 'Surface near-expiry markdowns from timestamped product rows with verification, stale evidence, and confidence labels.'
  },
  '/favorites': {
    title: 'Favorite grocery items | GroceryView',
    description: 'View signed-in bookmarked products with current cheapest price and store evidence.',
    noIndex: true
  },
  '/fuel': {
    title: 'Fuel prices by grade | GroceryView',
    description: 'View source-backed fuel observations by grade with price per litre, domain=fuel modeling, and operator provenance.'
  },
  '/household': {
    title: 'Household grocery planning gate | GroceryView',
    description: 'Household planning stays fail-closed until verified private profile and basket records are connected.'
  },
  '/login': {
    title: 'Sign in to GroceryView',
    description: 'Authentication is withheld in the static build until a production auth provider can return a verified user session.',
    noIndex: true
  },
  '/list': {
    title: 'Shopping list check-off | GroceryView',
    description: 'Check off grocery list items while shopping with browser-local checked state that survives refreshes.',
    noIndex: true
  },
  '/map': {
    title: 'Sweden grocery store map and price heat overlay | GroceryView',
    description: 'Map verified OSM grocery stores with chain-index marker colors, district heat signals, and cheapest-chain context.'
  },
  '/meal-planner': {
    title: 'Deal-based grocery meal planner | GroceryView',
    description: 'Build student and family meal ideas from verified deal rows, serving costs, leftovers, and source confidence.'
  },
  '/meal-cost': {
    title: 'Ingredient-level grocery meal costing | GroceryView',
    description: 'Cost a meal from verified ingredient prices, package quantities, serving counts, and cheapest complete-chain evidence.'
  },
  '/nutrition-value': {
    title: 'Nutrition per krona rankings | GroceryView',
    description: 'Rank grocery products by protein, calories, fibre, and macro value per SEK using real nutrition and price inputs.'
  },
  '/openprices-depth': {
    title: 'OpenPrices observation depth | GroceryView',
    description: 'Review community SEK observation depth, freshness, top products, and claim boundaries for GroceryView price history.'
  },
  '/pantry-planner': {
    title: 'Pantry replenishment planner | GroceryView',
    description: 'Plan pantry replenishment from verified basket needs, expiry signals, missing-price blockers, and source coverage.'
  },
  '/pharmacy': {
    title: 'Pharmacy OTC price foundation | GroceryView',
    description: 'Preview the domain-scoped OTC pharmacy price model while prescription and non-observed pharmacy prices remain withheld.'
  },
  '/price-reports': {
    title: 'Price report evidence gate | GroceryView',
    description: 'Crowd price reports are blocked from public claims until verified submissions, trust records, and moderation are wired.'
  },
  '/privacy': {
    title: 'Privacy and data controls | GroceryView',
    description: 'Read GroceryView privacy guardrails, private data gates, and source boundaries for account and receipt information.'
  },
  '/products': {
    title: 'Verified Swedish grocery product catalogue | GroceryView',
    description: 'Browse verified product tickers with prices, unit-price cards, OpenFoodFacts metadata, image-first browsing, and deal signals.'
  },
  '/savings-dashboard': {
    title: 'Personal grocery inflation dashboard | GroceryView',
    description: 'Track grocery inflation, fixed-income budgets, weekly student budgets, and staples price stability from real core summaries.'
  },
  '/scanner': {
    title: 'Receipt scanner evidence gate | GroceryView',
    description: 'Receipt scanning stays gated until production uploads, extraction records, and account-bound review are verified.'
  },
  '/screener': {
    title: 'Verified deal screener | GroceryView',
    description: 'Sort and filter verified grocery deal rows by biggest price drop, cheapest SEK per kg, and widest cross-chain spread.'
  },
  '/settings': {
    title: 'Settings data export | GroceryView',
    description: 'Download signed-in account data exports for lists, alerts, preferences, analytics events, and other private GDPR sections.',
    noIndex: true
  },
  '/seasonal-calendar': {
    title: 'Seasonal produce price calendar | GroceryView',
    description: 'Find the best time to buy produce from historical monthly averages, with no forecasted prices and eco planning guardrails.'
  },
  '/shopping-trips': {
    title: 'Shopping trip and route optimizer | GroceryView',
    description: 'Compare basket trip costs, nearest-store options, delivery evidence, and cheapest-store routing without private location data.'
  },
  '/store-coverage': {
    title: 'Sweden grocery store coverage | GroceryView',
    description: 'Audit OpenStreetMap grocery store brand and format coverage without inferring branch-level prices from location data.'
  },
  '/stores': {
    title: 'Sweden grocery store directory | GroceryView',
    description: 'Browse verified Swedish grocery store locations, brands, formats, and source coverage from OpenStreetMap.'
  },
  '/unit-price-alerts': {
    title: 'Unit-price spread alerts | GroceryView',
    description: 'Spot wide unit-price spreads and cheapest-per-unit opportunities across matched chain products.'
  },
  '/alerts': {
    title: 'Manage grocery price alerts | GroceryView',
    description: 'List active target-price alerts, compare targets with verified current chain prices, and delete alerts that no longer matter.'
  },
  '/watchlist': {
    title: 'Grocery watchlist price alerts | GroceryView',
    description: 'Track watchlist alerts, weekly personalised email digests, diaper price drops, budget essentials, and planned notifications from verified price rows.'
  },
  '/weekly-basket': {
    title: 'Weekly grocery basket optimizer | GroceryView',
    description: 'Compare weekly basket strategies, split-shop savings, family-pack unit prices, and recurring digest signals.'
  }
} satisfies Record<string, Omit<RouteMetadataConfig, 'path'>>;

function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export function languageAlternateUrls(path: string) {
  if (path === '/' || path === '') {
    return {
      'sv-SE': absoluteUrl('/sv'),
      'en-SE': absoluteUrl('/en'),
      'x-default': absoluteUrl('/')
    };
  }

  return {
    'sv-SE': absoluteUrl(path),
    'en-SE': absoluteUrl(path),
    'x-default': absoluteUrl(path)
  };
}

function truncateDescription(description: string) {
  return description.length > 180 ? `${description.slice(0, 177)}...` : description;
}

export function routeMetadata(route: keyof typeof routeMetadataCatalog | RouteMetadataConfig): Metadata {
  const config = typeof route === 'string' ? { path: route, ...routeMetadataCatalog[route] } : route;
  const canonical = absoluteUrl(config.path);
  const title = config.title;
  const description = truncateDescription(config.description || defaultDescription);
  const image = config.imagePath ? [{ url: absoluteUrl(config.imagePath), width: 1200, height: 630, alt: config.imageAlt ?? title }] : undefined;
  const robots = config.noIndex
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-snippet': -1,
          'max-image-preview': 'large' as const,
          'max-video-preview': -1
        }
      };

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    manifest: '/manifest.webmanifest',
    alternates: { canonical: canonical, languages: languageAlternateUrls(config.path) },
    other: {
      'x-groceryview-hreflang-boundary': localeNegotiatedCurrentRouteCaveat
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      locale: 'sv_SE',
      type: 'website',
      ...(image ? { images: image } : {})
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: image.map(({ url, alt }) => ({ url, alt })) } : {})
    },
    robots: robots
  };
}

export function metadataForProduct(product: ProductSeoInput): Metadata {
  const price = product.lowestPrice ?? product.priceMedian;
  const priceCopy = typeof price === 'number' ? ` Current verified price signal: ${price.toLocaleString('sv-SE')} kr.` : '';
  const brand = product.brand ?? product.brands;
  return routeMetadata({
    path: `/products/${product.slug}`,
    title: `${product.name} price ticker | GroceryView`,
    description: `Compare ${product.name}${brand ? ` from ${brand}` : ''} across Swedish grocery data with deal score, unit price, smart swaps, and confidence labels.${priceCopy}`,
    imagePath: `/products/${product.slug}/opengraph-image`,
    imageAlt: `${product.name} verified GroceryView price image`
  });
}

export function metadataForCategory(category: { slug: string; label: string }): Metadata {
  return routeMetadata({
    path: `/categories/${category.slug}`,
    title: `${category.label} grocery deals and price coverage | GroceryView`,
    description: `Browse verified ${category.label} grocery rows with category deal leaders, chain spreads, OpenPrices observations, and source freshness.`
  });
}

export function metadataForStore(store: StoreSeoInput): Metadata {
  const place = store.city || store.district ? ` in ${[store.district, store.city].filter(Boolean).join(', ')}` : '';
  return routeMetadata({
    path: `/stores/${store.slug}`,
    title: `${store.name} store record | GroceryView`,
    description: `Verified OpenStreetMap grocery store record for ${store.name}, ${store.brand}${place}. Prices are not inferred from store location.`
  });
}
