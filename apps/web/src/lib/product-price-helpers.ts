import { axfoodProducts, type AxfoodProduct, type ChainPrice } from './axfood-products';

const CHAIN_LABELS: Record<string, string> = {
  coop: 'Coop',
  hemkop: 'Hemköp',
  ica: 'ICA',
  willys: 'Willys'
};

export type MatchedCatalogListPrice = {
  chainId: string;
  chainName: string;
  price: number;
  priceText: string;
  priceUnit: string;
  productName: string;
  productSlug: string;
  sourceLabel: string;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE').normalize('NFKD').replace(/\p{Diacritic}/gu, '');
}

function isPriced(price: ChainPrice | undefined): price is ChainPrice & { price: number } {
  return typeof price?.price === 'number' && Number.isFinite(price.price);
}

function productMatches(product: AxfoodProduct, lookupValue: string) {
  const normalizedLookup = normalize(lookupValue);
  if (!normalizedLookup) return false;
  return [product.slug, product.code, product.name]
    .some((value) => normalize(value).includes(normalizedLookup) || normalizedLookup.includes(normalize(value)));
}

function findProduct(lookupValue: string, products: readonly AxfoodProduct[]) {
  return products.find((product) => normalize(product.slug) === normalize(lookupValue) || normalize(product.code) === normalize(lookupValue))
    ?? products.find((product) => productMatches(product, lookupValue))
    ?? null;
}

export function matchedCatalogPriceForListItem(
  lookupValue: string | null | undefined,
  products: readonly AxfoodProduct[] = axfoodProducts
): MatchedCatalogListPrice | null {
  if (!lookupValue) return null;
  const product = findProduct(lookupValue, products);
  if (!product) return null;

  const cheapestChain = Object.entries(product.chains)
    .filter((entry): entry is [string, ChainPrice & { price: number }] => isPriced(entry[1]))
    .sort((left, right) => left[1].price - right[1].price)[0];

  if (cheapestChain) {
    const [chainId, chainPrice] = cheapestChain;
    return {
      chainId,
      chainName: CHAIN_LABELS[chainId] ?? chainId,
      price: chainPrice.price,
      priceText: chainPrice.priceText || `${chainPrice.price.toLocaleString('sv-SE')} kr`,
      priceUnit: chainPrice.priceUnit || 'kr/st',
      productName: product.name,
      productSlug: product.slug,
      sourceLabel: 'matched catalog cheapest-chain price'
    };
  }

  if (Number.isFinite(product.lowestPrice)) {
    return {
      chainId: product.lowestChain,
      chainName: CHAIN_LABELS[product.lowestChain] ?? product.lowestChain,
      price: product.lowestPrice,
      priceText: `${product.lowestPrice.toLocaleString('sv-SE')} kr`,
      priceUnit: 'kr/st',
      productName: product.name,
      productSlug: product.slug,
      sourceLabel: 'matched catalog lowestPrice fallback'
    };
  }

  return null;
}
