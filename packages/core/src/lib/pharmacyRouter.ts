export type PharmacyCountryCode = 'SE' | 'NO' | 'DK' | 'FI' | 'IS';

export type RecurringMedicationRequest = {
  country: PharmacyCountryCode;
  dose: string;
  genericName: string;
  quantity?: number;
};

export type PharmacySourceOffer = {
  country: PharmacyCountryCode;
  currency: 'SEK' | 'NOK' | 'DKK' | 'EUR' | 'ISK';
  legalSource: true;
  pharmacyName: string;
  price: number;
  programName?: string;
  subscriptionDiscountPercent?: number;
};

export type PharmacyRouteRecommendation = {
  country: PharmacyCountryCode;
  dose: string;
  genericName: string;
  legalSourceOnly: true;
  recommendationLabel: string;
  selected: PharmacySourceOffer & {
    effectivePrice: number;
    savings: number;
  };
  alternatives: Array<PharmacySourceOffer & {
    effectivePrice: number;
    savings: number;
  }>;
};

const fallbackCurrency: Record<PharmacyCountryCode, PharmacySourceOffer['currency']> = {
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  FI: 'EUR',
  IS: 'ISK'
};

const defaultSubscriptionOffers: PharmacySourceOffer[] = [
  { country: 'SE', currency: 'SEK', legalSource: true, pharmacyName: 'Apoteket', price: 129, programName: 'Kronoval', subscriptionDiscountPercent: 12 },
  { country: 'SE', currency: 'SEK', legalSource: true, pharmacyName: 'Apotea', price: 119, programName: 'Apotea repeat', subscriptionDiscountPercent: 8 },
  { country: 'NO', currency: 'NOK', legalSource: true, pharmacyName: 'Apotek 1', price: 149, programName: 'Fast resept', subscriptionDiscountPercent: 7 },
  { country: 'DK', currency: 'DKK', legalSource: true, pharmacyName: 'Apotekeren', price: 118, programName: 'Gentagelsesrecept', subscriptionDiscountPercent: 5 },
  { country: 'FI', currency: 'EUR', legalSource: true, pharmacyName: 'Yliopiston Apteekki', price: 14.5, programName: 'Uusi tilaus', subscriptionDiscountPercent: 4 },
  { country: 'IS', currency: 'ISK', legalSource: true, pharmacyName: 'Lyfja', price: 2190, programName: 'Endurtekin lyf', subscriptionDiscountPercent: 5 }
];

function normalizeMedication(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('sv-SE');
}

function effectivePrice(offer: PharmacySourceOffer, quantity: number) {
  const discount = Math.min(Math.max(offer.subscriptionDiscountPercent ?? 0, 0), 100) / 100;
  return Math.round(offer.price * quantity * (1 - discount) * 100) / 100;
}

function formatMoney(value: number, currency: PharmacySourceOffer['currency']) {
  return new Intl.NumberFormat('sv-SE', { currency, maximumFractionDigits: currency === 'ISK' ? 0 : 2, style: 'currency' }).format(value);
}

export function recommendPharmacySource(
  request: RecurringMedicationRequest,
  offers: PharmacySourceOffer[] = defaultSubscriptionOffers
): PharmacyRouteRecommendation | null {
  const genericName = normalizeMedication(request.genericName);
  const dose = normalizeMedication(request.dose);
  if (!genericName || !dose) return null;

  const quantity = Math.max(1, Math.trunc(request.quantity ?? 1));
  const countryOffers = offers
    .filter((offer) => offer.legalSource && offer.country === request.country)
    .map((offer) => {
      const price = effectivePrice(offer, quantity);
      const undiscounted = Math.round(offer.price * quantity * 100) / 100;
      return {
        ...offer,
        effectivePrice: price,
        savings: Math.max(0, Math.round((undiscounted - price) * 100) / 100)
      };
    })
    .sort((left, right) => left.effectivePrice - right.effectivePrice || right.savings - left.savings || left.pharmacyName.localeCompare(right.pharmacyName, 'sv-SE'));

  if (countryOffers.length === 0) return null;

  const selected = countryOffers[0]!;
  return {
    country: request.country,
    dose,
    genericName,
    legalSourceOnly: true,
    recommendationLabel: `${selected.pharmacyName}${selected.programName ? ` ${selected.programName}` : ''} is cheapest at ${formatMoney(selected.effectivePrice, selected.currency ?? fallbackCurrency[request.country])}; prescription purchase is not initiated.`,
    selected,
    alternatives: countryOffers.slice(1)
  };
}
