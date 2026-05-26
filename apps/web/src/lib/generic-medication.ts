export type MedicationProductKind = 'branded' | 'generic';

export type MedicationComparisonProduct = {
  slug: string;
  name: string;
  brand: string;
  activeIngredientId: string;
  activeIngredient: string;
  strength: string;
  packageLabel: string;
  productKind: MedicationProductKind;
  averagePrice: number;
  observationCount: number;
  sourceLabel: string;
};

export type GenericMedicationComparison = {
  brandedProduct: MedicationComparisonProduct;
  genericProducts: MedicationComparisonProduct[];
  activeIngredient: string;
  averageGenericPrice: number;
  averageSavings: number;
  averageSavingsPercent: number;
  evidenceCount: number;
};

export const medicationComparisonProducts = [
  {
    slug: 'ipren-400mg-30-tablets',
    name: 'Ipren 400 mg',
    brand: 'Ipren',
    activeIngredientId: 'ibuprofen',
    activeIngredient: 'Ibuprofen',
    strength: '400 mg',
    packageLabel: '30 tablets',
    productKind: 'branded',
    averagePrice: 69.9,
    observationCount: 4,
    sourceLabel: 'Public OTC pharmacy catalog rows'
  },
  {
    slug: 'ibuprofen-orifarm-400mg-30-tablets',
    name: 'Ibuprofen Orifarm 400 mg',
    brand: 'Orifarm',
    activeIngredientId: 'ibuprofen',
    activeIngredient: 'Ibuprofen',
    strength: '400 mg',
    packageLabel: '30 tablets',
    productKind: 'generic',
    averagePrice: 44.9,
    observationCount: 3,
    sourceLabel: 'Public OTC pharmacy catalog rows'
  },
  {
    slug: 'ibuprofen-apofri-400mg-30-tablets',
    name: 'Ibuprofen Apofri 400 mg',
    brand: 'Apofri',
    activeIngredientId: 'ibuprofen',
    activeIngredient: 'Ibuprofen',
    strength: '400 mg',
    packageLabel: '30 tablets',
    productKind: 'generic',
    averagePrice: 49.9,
    observationCount: 2,
    sourceLabel: 'Public OTC pharmacy catalog rows'
  },
  {
    slug: 'alvedon-500mg-20-tablets',
    name: 'Alvedon 500 mg',
    brand: 'Alvedon',
    activeIngredientId: 'paracetamol',
    activeIngredient: 'Paracetamol',
    strength: '500 mg',
    packageLabel: '20 tablets',
    productKind: 'branded',
    averagePrice: 54.9,
    observationCount: 5,
    sourceLabel: 'Public OTC pharmacy catalog rows'
  },
  {
    slug: 'paracetamol-apofri-500mg-20-tablets',
    name: 'Paracetamol Apofri 500 mg',
    brand: 'Apofri',
    activeIngredientId: 'paracetamol',
    activeIngredient: 'Paracetamol',
    strength: '500 mg',
    packageLabel: '20 tablets',
    productKind: 'generic',
    averagePrice: 34.9,
    observationCount: 4,
    sourceLabel: 'Public OTC pharmacy catalog rows'
  },
  {
    slug: 'clarityn-10mg-30-tablets',
    name: 'Clarityn 10 mg',
    brand: 'Clarityn',
    activeIngredientId: 'loratadine',
    activeIngredient: 'Loratadine',
    strength: '10 mg',
    packageLabel: '30 tablets',
    productKind: 'branded',
    averagePrice: 119,
    observationCount: 3,
    sourceLabel: 'Public OTC pharmacy catalog rows'
  },
  {
    slug: 'loratadin-ratiopharm-10mg-30-tablets',
    name: 'Loratadin Ratiopharm 10 mg',
    brand: 'Ratiopharm',
    activeIngredientId: 'loratadine',
    activeIngredient: 'Loratadine',
    strength: '10 mg',
    packageLabel: '30 tablets',
    productKind: 'generic',
    averagePrice: 79,
    observationCount: 2,
    sourceLabel: 'Public OTC pharmacy catalog rows'
  }
] satisfies MedicationComparisonProduct[];

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildGenericMedicationComparison(slug: string): GenericMedicationComparison | null {
  const brandedProduct = medicationComparisonProducts.find((product) => product.slug === slug && product.productKind === 'branded');
  if (!brandedProduct) return null;

  const genericProducts = medicationComparisonProducts.filter((product) => (
    product.productKind === 'generic'
    && product.activeIngredientId === brandedProduct.activeIngredientId
    && product.strength === brandedProduct.strength
    && product.packageLabel === brandedProduct.packageLabel
  ));
  if (genericProducts.length === 0) return null;

  const averageGenericPrice = average(genericProducts.map((product) => product.averagePrice));
  const averageSavings = brandedProduct.averagePrice - averageGenericPrice;
  const evidenceCount = brandedProduct.observationCount + genericProducts.reduce((sum, product) => sum + product.observationCount, 0);

  return {
    brandedProduct,
    genericProducts,
    activeIngredient: brandedProduct.activeIngredient,
    averageGenericPrice,
    averageSavings,
    averageSavingsPercent: brandedProduct.averagePrice > 0 ? (averageSavings / brandedProduct.averagePrice) * 100 : 0,
    evidenceCount
  };
}

export const brandedMedicationSlugs = medicationComparisonProducts
  .filter((product) => product.productKind === 'branded')
  .map((product) => product.slug);
