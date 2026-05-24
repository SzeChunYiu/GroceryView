import { NextRequest, NextResponse } from 'next/server';

const barcodeFixtures = [
  { barcode: '0735000123456', slug: 'milk-1l', name: 'Milk 1L' },
  { barcode: '0735000999999', slug: 'coffee-450g', name: 'Coffee 450g' },
];

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('barcode')?.trim() ?? '';
  const match = barcodeFixtures.find((product) => product.barcode === barcode) ?? null;

  return NextResponse.json({ barcode, match });
}
