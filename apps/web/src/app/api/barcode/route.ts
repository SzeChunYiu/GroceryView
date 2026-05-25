import { NextResponse } from 'next/server';
import { openFoodFactsCatalog } from '@/lib/openfoodfacts-catalog';
import { pricedProducts } from '@/lib/openprices-products';

export const runtime = 'nodejs';

function normalizeBarcode(value: string | null) {
  return (value ?? '').replace(/\D/g, '').slice(0, 14);
}

function productPayload(product: { code: string; slug: string; name: string; brands?: string; quantity?: string }, source: string) {
  return {
    barcode: product.code,
    href: `/products/${product.slug}`,
    name: product.name,
    brand: product.brands || 'Brand not reported',
    quantity: product.quantity || 'quantity not reported',
    source
  };
}

export async function GET(request: Request) {
  const barcode = normalizeBarcode(new URL(request.url).searchParams.get('ean'));
  if (barcode.length < 8) {
    return NextResponse.json({ error: 'invalid_barcode', barcode }, { status: 400 });
  }

  const openFoodFactsMatch = openFoodFactsCatalog.find((product) => normalizeBarcode(product.code) === barcode);
  if (openFoodFactsMatch) {
    return NextResponse.json({ status: 'matched', product: productPayload(openFoodFactsMatch, 'openfoodfacts_catalog') });
  }

  const pricedMatch = pricedProducts.find((product) => normalizeBarcode(product.code) === barcode);
  if (pricedMatch) {
    return NextResponse.json({ status: 'matched', product: productPayload(pricedMatch, 'openprices_products') });
  }

  return NextResponse.json({ status: 'miss', barcode, product: null }, { status: 404 });
}
