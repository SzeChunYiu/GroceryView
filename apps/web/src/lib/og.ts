import { chainPriceRows, findProduct, formatSek, labelFromSlug } from './verified-data';

type Product = NonNullable<ReturnType<typeof findProduct>>;

export type ItemOpenGraphModel = {
  name: string;
  brand: string;
  category: string;
  image: string | null;
  priceLabel: string;
  priceContext: string;
  evidenceLabel: string;
  routePath: string;
};

export const itemOpenGraphSize = { width: 1200, height: 630 } as const;

export function brandForOgProduct(product: Product) {
  return 'lowestPrice' in product ? product.brand : product.brands || 'Brand not reported';
}

export function currentPriceForOgProduct(product: Product) {
  if ('lowestPrice' in product) {
    const rows = chainPriceRows(product);
    return {
      priceLabel: formatSek(product.lowestPrice),
      priceContext: `${product.lowestChain} current lowest`,
      evidenceLabel: `${rows.length} chain price row${rows.length === 1 ? '' : 's'} · GroceryView verified`
    };
  }

  const latestObservation = [...product.observations].sort((left, right) => right.date.localeCompare(left.date))[0];
  return {
    priceLabel: formatSek(latestObservation?.price ?? product.priceMedian),
    priceContext: latestObservation ? `latest observed ${latestObservation.date}` : 'OpenPrices median',
    evidenceLabel: `${product.observationCount.toLocaleString('sv-SE')} OpenPrices observation${product.observationCount === 1 ? '' : 's'}`
  };
}

export function itemOpenGraphModel(product: Product, id: string): ItemOpenGraphModel {
  const price = currentPriceForOgProduct(product);
  return {
    name: product.name,
    brand: brandForOgProduct(product),
    category: labelFromSlug(product.category),
    image: product.image || null,
    routePath: `/items/${id}`,
    ...price
  };
}
