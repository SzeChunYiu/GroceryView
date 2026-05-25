export type BarcodeLookupCandidate = {
  code: string;
  slug: string;
  name: string;
  brands: string;
  quantity: string;
};

export type MissingProductDraft = {
  barcode: string;
  title: string;
  evidence: string[];
};

export type BarcodeLookupResult =
  | {
    status: 'matched';
    barcode: string;
    productName: string;
    productHref: string;
    brandLabel: string;
    quantityLabel: string;
  }
  | {
    status: 'missing';
    barcode: string;
    draft: MissingProductDraft;
  };

export function normalizeBarcode(value: string) {
  return value.replace(/\D/g, '');
}

export function missingProductDraftForBarcode(barcode: string): MissingProductDraft {
  return {
    barcode,
    title: `Missing product for EAN ${barcode}`,
    evidence: [
      'barcode-camera-scan',
      'shopper can add product name, store hint, and package size before submitting',
      'no price, stock, or retailer availability inferred from the scan'
    ]
  };
}

export function resolveBarcodeLookup(value: string, candidates: BarcodeLookupCandidate[]): BarcodeLookupResult | null {
  const barcode = normalizeBarcode(value);
  if (barcode.length < 8) return null;

  const match = candidates.find((candidate) => normalizeBarcode(candidate.code) === barcode);
  if (match) {
    return {
      status: 'matched',
      barcode,
      productName: match.name,
      productHref: `/products/${match.slug}`,
      brandLabel: match.brands || 'Brand not reported',
      quantityLabel: match.quantity || 'Quantity not reported'
    };
  }

  return {
    status: 'missing',
    barcode,
    draft: missingProductDraftForBarcode(barcode)
  };
}
