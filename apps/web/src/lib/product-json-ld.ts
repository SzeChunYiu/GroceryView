const siteUrl = 'https://grocery-web-mu.vercel.app';

type ChainPrice = {
  price: number | null;
  isAvailable?: boolean;
};

type ChainProductJsonLdInput = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  image: string | null;
  chains: Record<string, ChainPrice>;
  lowestPrice: number;
  highestPrice: number;
  inChains: string[];
};

type OpenPricesProductJsonLdInput = {
  slug: string;
  name: string;
  brands: string;
  category: string;
  image: string;
  priceMin: number;
  priceMax: number;
  observationCount: number;
};

export type ProductJsonLdInput = ChainProductJsonLdInput | OpenPricesProductJsonLdInput;

function isChainProduct(product: ProductJsonLdInput): product is ChainProductJsonLdInput {
  return 'lowestPrice' in product;
}

function labelFromSlug(slug: string) {
  return slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function productBrandName(product: ProductJsonLdInput) {
  const brand = isChainProduct(product) ? product.brand : product.brands;
  const normalized = brand.trim();
  return normalized.length > 0 ? normalized : null;
}

function chainPriceRows(product: ChainProductJsonLdInput) {
  return Object.values(product.chains)
    .filter((row): row is ChainPrice & { price: number } => typeof row.price === 'number' && Number.isFinite(row.price));
}

function availabilityFor(product: ChainProductJsonLdInput) {
  const rowsWithAvailability = chainPriceRows(product).filter((row) => typeof row.isAvailable === 'boolean');
  if (rowsWithAvailability.length === 0) return undefined;
  return rowsWithAvailability.some((row) => row.isAvailable)
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';
}

export function productOfferFor(product: ProductJsonLdInput) {
  if (isChainProduct(product)) {
    const prices = chainPriceRows(product).map((row) => row.price);
    const availability = availabilityFor(product);
    return {
      '@type': 'AggregateOffer',
      priceCurrency: 'SEK',
      lowPrice: prices.length ? Math.min(...prices) : product.lowestPrice,
      highPrice: prices.length ? Math.max(...prices) : product.highestPrice,
      offerCount: Math.max(prices.length, product.inChains.length),
      ...(availability ? { availability } : {}),
      url: `${siteUrl}/products/${product.slug}`
    };
  }

  return {
    '@type': 'AggregateOffer',
    priceCurrency: 'SEK',
    lowPrice: product.priceMin,
    highPrice: product.priceMax,
    offerCount: product.observationCount,
    url: `${siteUrl}/products/${product.slug}`
  };
}

export function productJsonLdFor(product: ProductJsonLdInput) {
  const brandName = productBrandName(product);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.image ? { image: [product.image] } : {}),
    ...(brandName ? { brand: { '@type': 'Brand', name: brandName } } : {}),
    category: labelFromSlug(product.category),
    offers: productOfferFor(product)
  };
}
