import { describe, expect, it } from 'vitest';
import { findCheapestCrossCategorySource, type CrossCategoryPriceCandidate } from '../crossCategoryCompare.js';

type PersonalCareSku = {
  productId: string;
  name: string;
  sku: string;
  category: string;
};

const retailerFixtures = [
  { chainId: 'ica-se', chainName: 'ICA', retailerType: 'grocery' },
  { chainId: 'apoteket-se', chainName: 'Apoteket', retailerType: 'pharmacy' },
  { chainId: 'normal-se', chainName: 'Normal', retailerType: 'variety' },
  { chainId: 'kicks-se', chainName: 'KICKS', retailerType: 'cosmetics' }
] as const;

const personalCareSkus: PersonalCareSku[] = [
  { productId: 'colgate-total-original-75ml', name: 'Colgate Total Original Toothpaste 75 ml', sku: '8718951542387', category: 'oral_care' },
  { productId: 'colgate-max-white-75ml', name: 'Colgate Max White Toothpaste 75 ml', sku: '8718951569445', category: 'oral_care' },
  { productId: 'oral-b-pro-expert-75ml', name: 'Oral-B Pro-Expert Toothpaste 75 ml', sku: '8001841468585', category: 'oral_care' },
  { productId: 'sensodyne-repair-protect-75ml', name: 'Sensodyne Repair & Protect Toothpaste 75 ml', sku: '5054563063671', category: 'oral_care' },
  { productId: 'listerine-cool-mint-500ml', name: 'Listerine Cool Mint Mouthwash 500 ml', sku: '3574661254287', category: 'oral_care' },
  { productId: 'oral-b-essential-floss-50m', name: 'Oral-B Essential Floss 50 m', sku: '3014260090693', category: 'oral_care' },
  { productId: 'pampers-baby-dry-size-4', name: 'Pampers Baby-Dry Diapers Size 4', sku: '8006540825673', category: 'baby_care' },
  { productId: 'pampers-premium-protection-size-3', name: 'Pampers Premium Protection Diapers Size 3', sku: '8006540864795', category: 'baby_care' },
  { productId: 'libero-touch-size-4', name: 'Libero Touch Diapers Size 4', sku: '7322541070802', category: 'baby_care' },
  { productId: 'libero-comfort-size-5', name: 'Libero Comfort Diapers Size 5', sku: '7322541198841', category: 'baby_care' },
  { productId: 'always-ultra-normal-20ct', name: 'Always Ultra Normal Pads 20 ct', sku: '8001841123454', category: 'feminine_care' },
  { productId: 'always-ultra-night-18ct', name: 'Always Ultra Night Pads 18 ct', sku: '8001841123461', category: 'feminine_care' },
  { productId: 'libresse-ultra-normal-16ct', name: 'Libresse Ultra Normal Pads 16 ct', sku: '7322540864181', category: 'feminine_care' },
  { productId: 'tampax-compak-regular-16ct', name: 'Tampax Compak Regular Tampons 16 ct', sku: '4015400803387', category: 'feminine_care' },
  { productId: 'dove-original-deodorant-150ml', name: 'Dove Original Deodorant 150 ml', sku: '8712561849577', category: 'deodorant' },
  { productId: 'rexona-cobalt-dry-150ml', name: 'Rexona Cobalt Dry Deodorant 150 ml', sku: '8712561849614', category: 'deodorant' },
  { productId: 'nivea-men-dry-impact-150ml', name: 'Nivea Men Dry Impact Deodorant 150 ml', sku: '4005900848524', category: 'deodorant' },
  { productId: 'nivea-soft-cream-200ml', name: 'Nivea Soft Cream 200 ml', sku: '4005808801034', category: 'skin_care' },
  { productId: 'neutrogena-hand-cream-75ml', name: 'Neutrogena Hand Cream 75 ml', sku: '3574660034095', category: 'skin_care' },
  { productId: 'vaseline-original-100ml', name: 'Vaseline Original Petroleum Jelly 100 ml', sku: '8712561357041', category: 'skin_care' },
  { productId: 'eucerin-aquaphor-45ml', name: 'Eucerin Aquaphor Soothing Skin Balm 45 ml', sku: '4005800270470', category: 'skin_care' },
  { productId: 'head-shoulders-classic-250ml', name: 'Head & Shoulders Classic Clean Shampoo 250 ml', sku: '8001841004462', category: 'hair_care' },
  { productId: 'head-shoulders-apple-250ml', name: 'Head & Shoulders Apple Fresh Shampoo 250 ml', sku: '8001841004479', category: 'hair_care' },
  { productId: 'garnier-fructis-strength-250ml', name: 'Garnier Fructis Strength & Shine Shampoo 250 ml', sku: '3600541283213', category: 'hair_care' },
  { productId: 'loreal-elvital-color-vive-250ml', name: "L'Oreal Elvital Color Vive Shampoo 250 ml", sku: '3600522249605', category: 'hair_care' },
  { productId: 'dove-beauty-bar-100g', name: 'Dove Original Beauty Bar 100 g', sku: '8712561390444', category: 'soap' },
  { productId: 'nivea-creme-soft-shower-250ml', name: 'Nivea Creme Soft Shower Gel 250 ml', sku: '4005808864879', category: 'soap' },
  { productId: 'gillette-mach3-blades-4ct', name: 'Gillette Mach3 Razor Blades 4 ct', sku: '7702018467828', category: 'shaving' },
  { productId: 'gillette-fusion5-blades-4ct', name: 'Gillette Fusion5 Razor Blades 4 ct', sku: '7702018854659', category: 'shaving' },
  { productId: 'nivea-sun-protect-moisture-spf30-200ml', name: 'Nivea Sun Protect & Moisture SPF 30 200 ml', sku: '4005900695807', category: 'sun_care' }
];

function buildCandidates(product: PersonalCareSku, productIndex: number): CrossCategoryPriceCandidate[] {
  const trueRows = retailerFixtures.map((retailer, retailerIndex): CrossCategoryPriceCandidate => {
    const price = 24.9 + productIndex * 1.17 + retailerIndex * 2.05;
    return {
      productId: `${product.productId}-${retailer.chainId}`,
      productName: product.name,
      chainId: retailer.chainId,
      chainName: retailer.chainName,
      retailerType: retailer.retailerType,
      price: Number(price.toFixed(2)),
      currency: 'SEK',
      sku: retailerIndex % 2 === 0 ? product.sku : undefined,
      canonicalSku: retailerIndex % 2 === 1 ? formatSkuWithSeparators(product.sku) : undefined,
      sourceConfidence: 0.98
    };
  });

  return [
    ...trueRows,
    {
      productId: `${product.productId}-same-name-wrong-sku`,
      productName: product.name,
      chainId: 'wrong-sku-cosmetics',
      chainName: 'Wrong SKU Cosmetics',
      retailerType: 'cosmetics',
      price: 1,
      currency: 'SEK',
      sku: `WRONG-${product.sku}`,
      sourceConfidence: 0.99
    }
  ];
}

function formatSkuWithSeparators(sku: string): string {
  return `${sku.slice(0, 1)} ${sku.slice(1, 7)}-${sku.slice(7)}`;
}

describe('cross-retailer product_match review', () => {
  it('clusters 30 personal-care SKUs across grocery, pharmacy, variety, and cosmetics with 100% precision', () => {
    const reviewRows = personalCareSkus.map((product, productIndex) => {
      const result = findCheapestCrossCategorySource({
        canonicalProduct: { productId: product.productId, name: product.name, sku: product.sku },
        candidates: buildCandidates(product, productIndex)
      });

      const expectedProductIdPrefix = `${product.productId}-`;
      const truePositiveRows = result.rows.filter((row) => row.productId.startsWith(expectedProductIdPrefix) && !row.productId.endsWith('-same-name-wrong-sku'));
      const falsePositiveRows = result.rows.filter((row) => !truePositiveRows.includes(row));

      return {
        product,
        result,
        acceptedRows: result.rows.length,
        expectedRows: retailerFixtures.length,
        truePositiveRows: truePositiveRows.length,
        falsePositiveRows: falsePositiveRows.length
      };
    });

    const acceptedRows = reviewRows.reduce((sum, row) => sum + row.acceptedRows, 0);
    const expectedRows = reviewRows.reduce((sum, row) => sum + row.expectedRows, 0);
    const truePositiveRows = reviewRows.reduce((sum, row) => sum + row.truePositiveRows, 0);
    const falsePositiveRows = reviewRows.reduce((sum, row) => sum + row.falsePositiveRows, 0);
    const precision = truePositiveRows / acceptedRows;
    const recall = truePositiveRows / expectedRows;

    expect(personalCareSkus).toHaveLength(30);
    expect(reviewRows.map((row) => row.result.status)).toEqual(Array.from({ length: 30 }, () => 'priced'));
    expect(reviewRows.map((row) => row.result.coverage.retailerTypes)).toEqual(
      Array.from({ length: 30 }, () => ['cosmetics', 'grocery', 'pharmacy', 'variety'])
    );
    expect(reviewRows.map((row) => row.result.coverage.rejectedSourceCount)).toEqual(Array.from({ length: 30 }, () => 1));
    expect({ acceptedRows, expectedRows, truePositiveRows, falsePositiveRows, precision, recall }).toEqual({
      acceptedRows: 120,
      expectedRows: 120,
      truePositiveRows: 120,
      falsePositiveRows: 0,
      precision: 1,
      recall: 1
    });
  });
});
