import type { AxfoodProduct } from '@/lib/axfood-products';
import { chainPriceRows, findProduct, formatSek } from '@/lib/verified-data';

export type ReorderSuggestionInput = {
  productSlug: string;
  listItemName: string;
};

export type ReorderSuggestion = {
  productSlug: string;
  productName: string;
  listItemName: string;
  latestPrice: string;
  cheapestChain: string;
  chainSpreadPercent: number;
  reorderSignal: 'price-drop' | 'multi-chain-spread' | 'verified-price';
  reason: string;
  source: string;
};

export function buildReorderSuggestions(inputs: ReorderSuggestionInput[]): ReorderSuggestion[] {
  const seen = new Set<string>();
  return inputs.flatMap((input) => {
    if (seen.has(input.productSlug)) return [];
    seen.add(input.productSlug);

    const product = findProduct(input.productSlug);
    if (!product || !('chains' in product)) return [];

    const rows = chainPriceRows(product as AxfoodProduct).sort((left, right) => left.price - right.price || left.chain.localeCompare(right.chain, 'sv'));
    const cheapest = rows[0];
    if (!cheapest) return [];

    const highest = rows.at(-1)?.price ?? cheapest.price;
    const chainSpreadPercent = cheapest.price > 0 ? Math.round(((highest - cheapest.price) / cheapest.price) * 1000) / 10 : 0;
    const hasSavings = rows.some((row) => typeof row.savings === 'number' && row.savings > 0);
    const reorderSignal = hasSavings ? 'price-drop' : chainSpreadPercent >= 10 ? 'multi-chain-spread' : 'verified-price';

    return [{
      productSlug: product.slug,
      productName: product.name,
      listItemName: input.listItemName,
      latestPrice: formatSek(cheapest.price),
      cheapestChain: cheapest.chain,
      chainSpreadPercent,
      reorderSignal,
      reason: hasSavings
        ? 'Latest verified chain data includes an active savings row for this matched product slug.'
        : chainSpreadPercent >= 10
          ? 'Latest verified chain prices show a meaningful cross-chain spread; reorder at the cheapest observed chain.'
          : 'Latest verified chain price is available for this matched product slug.',
      source: `${rows.length} verified latest price row${rows.length === 1 ? '' : 's'} from chainPriceRows`
    }];
  }).sort((left, right) => {
    const signalRank = { 'price-drop': 0, 'multi-chain-spread': 1, 'verified-price': 2 } as const;
    return signalRank[left.reorderSignal] - signalRank[right.reorderSignal]
      || right.chainSpreadPercent - left.chainSpreadPercent
      || left.productName.localeCompare(right.productName, 'sv');
  });
}
