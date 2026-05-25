export type ProductDedupCandidate = {
  productId: string;
  chainId: string;
  retailerProductRef: string;
  eanCode?: string | null;
};

export type ProductDedupGroup = {
  eanCode: string;
  canonicalProductId: string;
  productIds: string[];
  refs: Array<{
    chainId: string;
    retailerProductRef: string;
    sourceProductId: string;
  }>;
};

export type ProductDedupSummary = {
  candidates: number;
  groups: number;
  mergedProducts: number;
  linkedRefs: number;
};

export const productChainRefsUpsertSql = `
  insert into product_chain_refs (canonical_product_id, source_product_id, chain_id, retailer_product_ref, ean_code, updated_at)
  values ($1, $2, $3, $4, $5, now())
  on conflict (chain_id, retailer_product_ref) do update set
    canonical_product_id = excluded.canonical_product_id,
    source_product_id = excluded.source_product_id,
    ean_code = excluded.ean_code,
    updated_at = now()
`;

function normalizeEan(value: string | null | undefined) {
  const ean = value?.replace(/\D/g, '') ?? '';
  return /^\d{8,14}$/.test(ean) ? ean : null;
}

export function buildProductDedupGroups(candidates: readonly ProductDedupCandidate[]): ProductDedupGroup[] {
  const groups = new Map<string, ProductDedupCandidate[]>();
  for (const candidate of candidates) {
    const eanCode = normalizeEan(candidate.eanCode);
    if (!eanCode || !candidate.productId || !candidate.chainId || !candidate.retailerProductRef) continue;
    groups.set(eanCode, [...(groups.get(eanCode) ?? []), { ...candidate, eanCode }]);
  }

  return [...groups.entries()].map(([eanCode, rows]) => {
    const productIds = [...new Set(rows.map((row) => row.productId))].sort();
    const canonicalProductId = productIds[0];
    return {
      eanCode,
      canonicalProductId,
      productIds,
      refs: rows.map((row) => ({
        chainId: row.chainId,
        retailerProductRef: row.retailerProductRef,
        sourceProductId: row.productId
      }))
    };
  });
}

export async function runProductEanDedupPostIngestStep(
  candidates: readonly ProductDedupCandidate[],
  query: (sql: string, params: readonly unknown[]) => Promise<unknown>
): Promise<ProductDedupSummary> {
  const groups = buildProductDedupGroups(candidates);
  let linkedRefs = 0;

  for (const group of groups) {
    for (const ref of group.refs) {
      await query(productChainRefsUpsertSql, [group.canonicalProductId, ref.sourceProductId, ref.chainId, ref.retailerProductRef, group.eanCode]);
      linkedRefs += 1;
    }
  }

  return {
    candidates: candidates.length,
    groups: groups.length,
    mergedProducts: groups.reduce((sum, group) => sum + Math.max(0, group.productIds.length - 1), 0),
    linkedRefs
  };
}
