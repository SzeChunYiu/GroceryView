export type PharmacyCountry = 'SE' | 'NO' | 'DK' | 'FI';

export type RecurringMedication = {
  genericName: string;
  dose: string;
  country: PharmacyCountry;
  monthlyQuantity?: number;
};

export type PharmacySourceOption = {
  sourceId: string;
  displayName: string;
  country: PharmacyCountry;
  legalSource: true;
  prescriptionRequired: boolean;
  subscriptionProgram?: string;
  subscriptionDiscountPercent: number;
  estimatedUnitPrice: number;
  estimatedMonthlyCost: number;
  currency: 'SEK' | 'NOK' | 'DKK' | 'EUR';
  fulfillment: 'online_pharmacy' | 'retail_pharmacy' | 'state_pharmacy';
  caveat: string;
};

export type PharmacyRecommendation = {
  medication: RecurringMedication;
  recommendation: PharmacySourceOption | null;
  options: PharmacySourceOption[];
  noPurchaseFlow: true;
  legalDisclaimer: string;
};

type PharmacyProgram = Omit<PharmacySourceOption, 'estimatedMonthlyCost'>;

const PROGRAMS: PharmacyProgram[] = [
  {
    sourceId: 'se-kronans-kronoval',
    displayName: 'Kronans Apotek Kronoval',
    country: 'SE',
    legalSource: true,
    prescriptionRequired: true,
    subscriptionProgram: 'Kronoval',
    subscriptionDiscountPercent: 10,
    estimatedUnitPrice: 42,
    currency: 'SEK',
    fulfillment: 'online_pharmacy',
    caveat: 'Requires a valid Swedish prescription and pharmacy eligibility check.'
  },
  {
    sourceId: 'se-apotea-recurring',
    displayName: 'Apotea recurring delivery',
    country: 'SE',
    legalSource: true,
    prescriptionRequired: true,
    subscriptionProgram: 'recurring_delivery',
    subscriptionDiscountPercent: 5,
    estimatedUnitPrice: 44,
    currency: 'SEK',
    fulfillment: 'online_pharmacy',
    caveat: 'Recommendation only; final price and substitution are confirmed by the pharmacy.'
  },
  {
    sourceId: 'no-apotek1-fast',
    displayName: 'Apotek 1 fast refill',
    country: 'NO',
    legalSource: true,
    prescriptionRequired: true,
    subscriptionProgram: 'fast_refill',
    subscriptionDiscountPercent: 4,
    estimatedUnitPrice: 48,
    currency: 'NOK',
    fulfillment: 'online_pharmacy',
    caveat: 'Requires Norwegian prescription validation.'
  },
  {
    sourceId: 'dk-apoteket-repeat',
    displayName: 'Apoteket repeat prescription',
    country: 'DK',
    legalSource: true,
    prescriptionRequired: true,
    subscriptionDiscountPercent: 0,
    estimatedUnitPrice: 36,
    currency: 'DKK',
    fulfillment: 'retail_pharmacy',
    caveat: 'Danish pharmacy rules and substitution controls apply.'
  },
  {
    sourceId: 'fi-yliopiston-apteekki',
    displayName: 'Yliopiston Apteekki renewal reminder',
    country: 'FI',
    legalSource: true,
    prescriptionRequired: true,
    subscriptionDiscountPercent: 0,
    estimatedUnitPrice: 4.2,
    currency: 'EUR',
    fulfillment: 'online_pharmacy',
    caveat: 'Finnish prescription validation and reimbursement rules apply.'
  }
];

export function recommendPharmacySource(input: RecurringMedication): PharmacyRecommendation {
  const medication = normalizeMedication(input);
  const monthlyQuantity = medication.monthlyQuantity ?? 30;
  const options = PROGRAMS
    .filter((program) => program.country === medication.country)
    .map((program) => withMonthlyCost(program, monthlyQuantity))
    .sort((a, b) => a.estimatedMonthlyCost - b.estimatedMonthlyCost || b.subscriptionDiscountPercent - a.subscriptionDiscountPercent);

  return {
    medication,
    recommendation: options[0] ?? null,
    options,
    noPurchaseFlow: true,
    legalDisclaimer: 'Pure recommendation only. GroceryView does not dispense, reserve, purchase, import, or substitute medication; a licensed pharmacy must verify legality, prescription status, stock, and final price.'
  };
}

function normalizeMedication(input: RecurringMedication): RecurringMedication {
  const genericName = input.genericName.trim().toLowerCase();
  const dose = input.dose.trim().toLowerCase();
  if (!genericName) throw new Error('genericName is required.');
  if (!dose) throw new Error('dose is required.');
  if (input.monthlyQuantity !== undefined && (!Number.isFinite(input.monthlyQuantity) || input.monthlyQuantity <= 0)) {
    throw new Error('monthlyQuantity must be positive when provided.');
  }
  return { ...input, genericName, dose };
}

function withMonthlyCost(program: PharmacyProgram, monthlyQuantity: number): PharmacySourceOption {
  const discountedUnitPrice = program.estimatedUnitPrice * (1 - program.subscriptionDiscountPercent / 100);
  return {
    ...program,
    estimatedMonthlyCost: roundMoney(discountedUnitPrice * monthlyQuantity)
  };
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
