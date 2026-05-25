export type AccountReceiptSpendRow = {
  id: string;
  userId: string;
  purchasedAt: string;
  totalAmount: number;
  merchantName?: string;
  sourceTable: 'receipt_uploads' | 'purchase_history';
};

export type GrocerySpendForecast = {
  receiptCount: number;
  actualSpend: number;
  projectedMonthlySpend: number | null;
  averageReceiptTotal: number | null;
  confidence: 'high' | 'medium' | 'low' | 'unverified';
  coverageLabel: string;
};

export type AccountReceiptSpendForecast = {
  userId: string | null;
  protected: true;
  endpoint: '/api/savings-dashboard/spend-forecast';
  sourceTables: ['receipt_uploads', 'purchase_history'];
  sourceContext: 'observed account source rows';
  forecast: GrocerySpendForecast | null;
  rows: AccountReceiptSpendRow[];
  watchpoints: Array<{ label: string; product: string; store: string; signal: string; action: string; href: string }>;
  guardrails: string[];
};

function daysInMonth(asOf: Date) {
  return new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 0)).getUTCDate();
}

export function forecastGrocerySpend(rows: AccountReceiptSpendRow[], asOf: Date = new Date()): GrocerySpendForecast {
  const validRows = rows.filter((row) => Number.isFinite(row.totalAmount) && row.totalAmount >= 0);
  const actualSpend = Math.round(validRows.reduce((sum, row) => sum + row.totalAmount, 0) * 100) / 100;

  if (validRows.length === 0) {
    return {
      receiptCount: 0,
      actualSpend: 0,
      projectedMonthlySpend: null,
      averageReceiptTotal: null,
      confidence: 'unverified',
      coverageLabel: 'No signed-in receipt_uploads or purchase_history rows are available for this account.'
    };
  }

  const earliestReceipt = validRows
    .map((row) => Date.parse(row.purchasedAt))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right)[0];
  const observedDays = earliestReceipt
    ? Math.max(1, Math.ceil((asOf.getTime() - earliestReceipt) / (24 * 60 * 60 * 1000)))
    : Math.min(daysInMonth(asOf), validRows.length * 7);
  const projectedMonthlySpend = Math.round((actualSpend / observedDays) * daysInMonth(asOf) * 100) / 100;
  const averageReceiptTotal = Math.round((actualSpend / validRows.length) * 100) / 100;

  return {
    receiptCount: validRows.length,
    actualSpend,
    projectedMonthlySpend,
    averageReceiptTotal,
    confidence: validRows.length >= 8 ? 'high' : validRows.length >= 3 ? 'medium' : 'low',
    coverageLabel: `${validRows.length} signed-in receipt rows from receipt_uploads or purchase_history.`
  };
}

export function loadAccountReceiptSpendForecast({
  asOf = new Date(),
  rows = [],
  userId
}: {
  asOf?: Date;
  rows?: AccountReceiptSpendRow[];
  userId: string | null;
}): AccountReceiptSpendForecast {
  const accountRows = userId ? rows.filter((row) => row.userId === userId) : [];
  const forecast = userId ? forecastGrocerySpend(accountRows, asOf) : null;

  return {
    userId,
    protected: true,
    endpoint: '/api/savings-dashboard/spend-forecast',
    sourceTables: ['receipt_uploads', 'purchase_history'],
    sourceContext: 'observed account source rows',
    forecast,
    rows: accountRows,
    watchpoints: [],
    guardrails: [
      'Requires a signed-in account before receipt or purchase_history rows are read.',
      'Raw receipt images and OCR text stay private; the dashboard only receives totals and redacted merchant metadata.',
      'No demo purchaseHistory, sample receipts, or estimated cash trips are used for the spend forecast.'
    ]
  };
}
