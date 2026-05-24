import { NextResponse } from 'next/server';
import { buildChainComparisonTable } from '@/lib/chain-compare';

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const products = searchParams.get('products') ?? undefined;
  const comparison = buildChainComparisonTable(products);

  return NextResponse.json({
    generatedAt: comparison.generatedAt,
    sourceLabel: comparison.sourceLabel,
    missingProductIds: comparison.missingProductIds,
    products: comparison.products.map((product) => ({
      productSlug: product.productSlug,
      productName: product.productName,
      packageLabel: product.packageLabel,
      matchLabel: product.matchLabel,
      bestChainName: product.bestChainName,
      bestPriceText: product.bestPriceText,
      stores: product.cells.map((cell) => ({
        chainId: cell.chainId,
        status: cell.status,
        priceText: cell.priceText,
        unitLabel: cell.unitLabel,
        productSlug: cell.productSlug,
        productName: cell.productName,
        latestTimestamp: comparison.generatedAt
      }))
    }))
  });
}
