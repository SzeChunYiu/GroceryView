export const categoryKeywordMap: Record<string, string[]> = {
  cheese: ['cheese', 'ost', 'cheddar', 'mozzarella', 'feta'],
  milk: ['milk', 'mjölk', 'yoghurt', 'yogurt'],
  bread: ['bread', 'bröd', 'baguette', 'limpa'],
  fruit: ['apple', 'äpple', 'banana', 'banan', 'orange'],
  vegetables: ['tomato', 'tomat', 'potato', 'potatis', 'carrot', 'morot'],
};

export function assignCategoryIdFromProductName(productName: string): string | null {
  const normalized = productName.toLowerCase();
  const match = Object.entries(categoryKeywordMap).find(([, keywords]) =>
    keywords.some((keyword) => normalized.includes(keyword))
  );

  return match?.[0] ?? null;
}

export function normaliseConnectorProductCategory<T extends { name: string; category_id?: string | null }>(product: T): T & { category_id: string | null } {
  return {
    ...product,
    category_id: product.category_id ?? assignCategoryIdFromProductName(product.name),
  };
}
