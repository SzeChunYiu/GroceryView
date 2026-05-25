import { axfoodProducts } from './axfood-products';

export type ShoppingListCheapestSource = {
  chainLabel: string;
  priceLabel: string;
  productSlug: string;
  spreadPercent: number;
};

const chainLabels: Record<string, string> = {
  hemkop: 'Hemköp',
  willys: 'Willys'
};

export function cheapestSourceForProductSlug(productSlug: string | null | undefined): ShoppingListCheapestSource | null {
  if (!productSlug) return null;
  const product = axfoodProducts.find((candidate) => candidate.slug === productSlug);
  if (!product || typeof product.lowestPrice !== 'number' || !Number.isFinite(product.lowestPrice)) return null;

  const lowestChain = product.lowestChain;
  const chainRow = product.chains[lowestChain as keyof typeof product.chains];
  const priceLabel = chainRow?.priceText ?? `${product.lowestPrice.toLocaleString('sv-SE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} kr`;

  return {
    chainLabel: chainLabels[lowestChain] ?? lowestChain,
    priceLabel,
    productSlug: product.slug,
    spreadPercent: product.spreadPct
  };
}
