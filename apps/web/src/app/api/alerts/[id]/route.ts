import { NextResponse } from 'next/server';
import { deletePriceAlert } from '../store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  if (!(await deletePriceAlert(id, searchParams.get('userEmail') ?? ''))) {
    return NextResponse.json({ error: 'Price alert not found.' }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
