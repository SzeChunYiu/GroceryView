export type PriceAlert = {
  id: string;
  userEmail: string;
  productId: string;
  targetPrice: number;
  createdAt: string;
};

export type PriceAlertInput = {
  userEmail: string;
  productId: string;
  targetPrice: number;
};

const priceAlerts = new Map<string, PriceAlert>();

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeEmail(value: unknown): string {
  if (!isNonEmptyString(value)) throw new Error('userEmail is required.');
  if (!value.includes('@')) throw new Error('userEmail must be an email address.');
  return value.trim().toLowerCase();
}

function normalizeInput(input: unknown): PriceAlertInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Alert body must be an object.');
  }

  const candidate = input as Record<string, unknown>;
  const targetPrice = typeof candidate.targetPrice === 'string'
    ? Number(candidate.targetPrice)
    : candidate.targetPrice;

  if (!isNonEmptyString(candidate.productId)) throw new Error('productId is required.');
  if (typeof targetPrice !== 'number' || !Number.isFinite(targetPrice) || targetPrice < 0) {
    throw new Error('targetPrice must be a non-negative number.');
  }

  return {
    userEmail: normalizeEmail(candidate.userEmail),
    productId: candidate.productId.trim(),
    targetPrice
  };
}

export function listPriceAlerts(userEmail: string): PriceAlert[] {
  const normalizedEmail = normalizeEmail(userEmail);
  return [...priceAlerts.values()]
    .filter((alert) => alert.userEmail === normalizedEmail)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id));
}

export function createPriceAlert(input: unknown): PriceAlert {
  const alertInput = normalizeInput(input);
  const alert: PriceAlert = {
    id: crypto.randomUUID(),
    ...alertInput,
    createdAt: new Date().toISOString()
  };
  priceAlerts.set(alert.id, alert);
  return alert;
}

export function deletePriceAlert(id: string, userEmail: string): boolean {
  const alert = priceAlerts.get(id);
  if (!alert || alert.userEmail !== normalizeEmail(userEmail)) return false;
  return priceAlerts.delete(id);
}
