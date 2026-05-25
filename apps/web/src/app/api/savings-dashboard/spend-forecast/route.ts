import { NextResponse } from 'next/server';
import { loadAccountReceiptSpendForecast } from '@/lib/account-receipt-spend-forecast';

function bearerUserId(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return token ? token.split(':')[0] ?? null : null;
}

export function GET(request: Request) {
  const userId = bearerUserId(request);

  if (!userId) {
    return NextResponse.json(
      {
        error: 'A signed-in user is required before observed receipt or purchase_history source rows can power the spend forecast.',
        requiredAuth: 'bearer',
        sourceTables: ['receipt_uploads', 'purchase_history']
      },
      { status: 401 }
    );
  }

  return NextResponse.json(loadAccountReceiptSpendForecast({ userId }));
}
