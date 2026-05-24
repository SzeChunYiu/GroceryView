export type ChainProduct = {
  id: string;
  ean_code: string | null;
  chain: string;
  sku: string;
  name: string;
  brand?: string | null;
};

export type CanonicalProductMerge = {
  ean_code: string;
  canonicalProduct: Pick<ChainProduct, 'name' | 'brand'>;
  chainRefs: Array<{ product_id: string; chain: string; sku: string }>;
};

export const productChainRefsUpsertSql = `
  insert into product_chain_refs (canonical_product_id, chain, sku, source_product_id, updated_at)
  values ($1, $2, $3, $4, now())
  on conflict (chain, sku) do update set
    canonical_product_id = excluded.canonical_product_id,
    source_product_id = excluded.source_product_id,
    updated_at = now()
`;

export function mergeProductsByEan(products: ChainProduct[]): CanonicalProductMerge[] {
  const groups = new Map<string, ChainProduct[]>();
  for (const product of products) {
    if (!product.ean_code) continue;
    groups.set(product.ean_code, [...(groups.get(product.ean_code) ?? []), product]);
  }

  return [...groups.entries()].map(([ean_code, rows]) => {
    const canonical = rows.reduce((best, row) => (row.name.length > best.name.length ? row : best), rows[0]);
    return {
      ean_code,
      canonicalProduct: { name: canonical.name, brand: canonical.brand ?? null },
      chainRefs: rows.map((row) => ({ product_id: row.id, chain: row.chain, sku: row.sku })),
    };
  });
}

export async function runProductDedupPostIngestStep(
  products: ChainProduct[],
  upsertCanonical: (merge: CanonicalProductMerge) => Promise<string>,
  query: (sql: string, params: unknown[]) => Promise<unknown>,
) {
  const merges = mergeProductsByEan(products);
  for (const merge of merges) {
    const canonicalProductId = await upsertCanonical(merge);
    for (const ref of merge.chainRefs) {
      await query(productChainRefsUpsertSql, [canonicalProductId, ref.chain, ref.sku, ref.product_id]);
    }
  }

  return { eanGroups: merges.length, linkedSkus: merges.reduce((total, merge) => total + merge.chainRefs.length, 0) };
}
