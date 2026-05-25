import { siteUrl } from '@/lib/seo';
import { chainPriceRows, findProduct, formatSek } from '@/lib/verified-data';

export const itemCheapestDealShareParam = 'cheapest-deal';

export type ShareableItemCheapestDeal = {
  available: boolean;
  itemId: string;
  productName: string;
  shareUrl: string;
  sharePath: string;
  cheapestDeal?: {
    sourceLabel: string;
    price: number;
    priceLabel: string;
    unitLabel: string;
    savingsLabel?: string;
    evidenceLabel: string;
  };
};

function shareUrlForItem(itemId: string) {
  const url = new URL(`/items/${encodeURIComponent(itemId)}`, siteUrl);
  url.searchParams.set('share', itemCheapestDealShareParam);
  url.hash = 'cheapest-deal';
  return url;
}

function finitePrice(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function shareableItemCheapestDeal(itemId: string): ShareableItemCheapestDeal {
  const product = findProduct(itemId);
  const url = shareUrlForItem(itemId);
  const base = {
    itemId,
    productName: product?.name ?? itemId,
    shareUrl: url.toString(),
    sharePath: `${url.pathname}${url.search}${url.hash}`
  };

  if (!product) {
    return {
      ...base,
      available: false
    };
  }

  if ('lowestPrice' in product) {
    const rows = chainPriceRows(product)
      .filter((row) => finitePrice(row.price))
      .sort((left, right) => left.price - right.price || String(left.chain).localeCompare(String(right.chain), 'sv-SE'));
    const availableRows = rows.filter((row) => row.isAvailable !== false);
    const cheapest = availableRows[0] ?? rows[0];

    if (!cheapest) {
      return {
        ...base,
        available: false
      };
    }

    return {
      ...base,
      available: true,
      cheapestDeal: {
        sourceLabel: String(cheapest.chain),
        price: cheapest.price,
        priceLabel: cheapest.priceText ?? formatSek(cheapest.price),
        unitLabel: cheapest.priceUnit ?? 'current chain price',
        savingsLabel: finitePrice(cheapest.savings) ? formatSek(cheapest.savings) : undefined,
        evidenceLabel: 'Current public chain catalogue evidence'
      }
    };
  }

  if (!finitePrice(product.priceMin)) {
    return {
      ...base,
      available: false
    };
  }

  return {
    ...base,
    available: true,
    cheapestDeal: {
      sourceLabel: 'OpenPrices observed low',
      price: product.priceMin,
      priceLabel: formatSek(product.priceMin),
      unitLabel: 'SEK observed price',
      evidenceLabel: `${product.observationCount} OpenPrices observation${product.observationCount === 1 ? '' : 's'} through ${product.lastObservedAt}`
    }
  };
}
