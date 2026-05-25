export type ShoppingListPdfPrice = {
  storeName: string;
  priceLabel: string;
};

export type ShoppingListPdfItem = {
  id: string;
  name: string;
  perStorePrices: ShoppingListPdfPrice[];
  quantity: string;
};

export type ShoppingListPdfDocument = {
  fileName: string;
  generatedAt: string;
  items: ShoppingListPdfItem[];
  subtitle: string;
  title: string;
};

export function buildShoppingListPdfDocument(input: {
  generatedAt: string;
  items: ShoppingListPdfItem[];
  listName: string;
}): ShoppingListPdfDocument {
  const normalizedTitle = input.listName.trim() || 'Shopping list';
  const itemCount = input.items.length;
  return {
    fileName: `${normalizedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'shopping-list'}-${input.generatedAt.slice(0, 10)}.pdf`,
    generatedAt: input.generatedAt,
    items: input.items,
    subtitle: `${itemCount} item${itemCount === 1 ? '' : 's'} with quantities and per-store price evidence.`,
    title: normalizedTitle
  };
}

export function printPriceSummary(item: ShoppingListPdfItem): string {
  return item.perStorePrices.length > 0
    ? item.perStorePrices.map((price) => `${price.storeName}: ${price.priceLabel}`).join(' | ')
    : 'No verified store price in the current list snapshot';
}
