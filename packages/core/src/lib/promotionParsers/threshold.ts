export type ThresholdPromotion = {
  kind: 'threshold';
  min_spend: number;
  discount: number;
};

const MONEY = '(\\d+(?:[\\s.]?\\d{3})*(?:[,.]\\d{1,2})?)';

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE').replace(/\s+/g, ' ');
}

function parseMoney(value: string): number | null {
  const normalized = value.replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function promotion(minSpend: string, discount: string): ThresholdPromotion | null {
  const parsedMinSpend = parseMoney(minSpend);
  const parsedDiscount = parseMoney(discount);
  if (parsedMinSpend === null || parsedDiscount === null) return null;
  return { kind: 'threshold', min_spend: parsedMinSpend, discount: parsedDiscount };
}

export function parseThresholdPromotion(text: string): ThresholdPromotion | null {
  const normalized = normalizeText(text);

  const spendThenDiscount = normalized.match(new RegExp(
    `\\b(?:vid\\s+)?(?:k[öo]p|handla)\\s+(?:f[öo]r\\s+)?(?:över|over|minst|min\\.?|fr[åa]n)\\s+${MONEY}\\s*(?:kr|sek)?(?:\\s*[,.:;-]\\s*|\\s+)(?:f[åa]\\s+)?${MONEY}\\s*(?:kr|sek)?\\s+rabatt\\b`,
    'i'
  ));
  if (spendThenDiscount) return promotion(spendThenDiscount[1], spendThenDiscount[2]);

  const discountThenSpend = normalized.match(new RegExp(
    `\\b${MONEY}\\s*(?:kr|sek)?\\s+rabatt\\s+vid\\s+(?:k[öo]p|handla)(?:\\s+f[öo]r)?\\s+(?:över|over|minst|min\\.?|fr[åa]n)\\s+${MONEY}\\s*(?:kr|sek)?\\b`,
    'i'
  ));
  if (discountThenSpend) return promotion(discountThenSpend[2], discountThenSpend[1]);

  return null;
}
