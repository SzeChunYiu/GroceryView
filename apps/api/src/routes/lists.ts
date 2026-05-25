export type ListOptimizationRequest = {
  allowTwoStoreSplit?: boolean;
  items: Array<{
    id: string;
    name: string;
    matchedProductSlug?: string;
  }>;
};

export const listsRouteContracts = {
  optimizeByStore: {
    method: 'POST',
    path: '/lists/optimize-by-store',
    description: 'Given a shopping list, compute the cheapest single-store plan and optional two-store split from verified price rows.'
  }
} as const;

export function normalizeListOptimizationRequest(body: unknown): ListOptimizationRequest {
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const rawItems = Array.isArray(record.items) ? record.items : [];
  return {
    allowTwoStoreSplit: record.allowTwoStoreSplit !== false,
    items: rawItems.map((item, index) => {
      const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
      return {
        id: String(row.id ?? `item-${index + 1}`),
        name: String(row.name ?? row.matchedProductSlug ?? `Item ${index + 1}`),
        matchedProductSlug: typeof row.matchedProductSlug === 'string' ? row.matchedProductSlug : undefined
      };
    })
  };
}
