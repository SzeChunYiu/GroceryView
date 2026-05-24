export type ThresholdPromotion = {
  kind: 'threshold';
  min_spend: number;
  discount: number;
};

function parseAmount(value: string): number {
  return Number(value.replace(',', '.'));
}

function promotion(amount: string, discount: string): ThresholdPromotion | null {
  const minSpend = parseAmount(amount);
  const discountAmount = parseAmount(discount);

  if (!Number.isFinite(minSpend) || !Number.isFinite(discountAmount)) return null;
  if (minSpend <= 0 || discountAmount <= 0) return null;

  return {
    kind: 'threshold',
    min_spend: minSpend,
    discount: discountAmount
  };
}

export function parseThresholdPromotion(text: string): ThresholdPromotion | null {
  const normalized = text.trim().replace(/\s+/g, ' ');
  const amount = '(\\d+(?:[,.]\\d+)?)';
  const spendPrefix = `(?:vid\\s+)?köp\\s+(?:över|over|minst|för)\\s+${amount}\\s*(?:kr|sek)`;
  const discountSuffix = `${amount}\\s*(?:kr|sek)\\s*(?:rabatt|avdrag)`;

  const spendThenDiscount = new RegExp(`${spendPrefix}.*?${discountSuffix}`, 'i').exec(normalized);
  if (spendThenDiscount?.[1] && spendThenDiscount[2]) {
    return promotion(spendThenDiscount[1], spendThenDiscount[2]);
  }

  const discountThenSpend = new RegExp(`${discountSuffix}.*?${spendPrefix}`, 'i').exec(normalized);
  if (discountThenSpend?.[1] && discountThenSpend[2]) {
    return promotion(discountThenSpend[2], discountThenSpend[1]);
  }

  return null;
}
