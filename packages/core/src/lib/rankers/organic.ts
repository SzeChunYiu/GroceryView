export type OrganicEcoListing = {
  promoId: string;
  productId: string;
  productName: string;
  savings: number;
  tags?: readonly string[];
  labels?: readonly string[];
  certifications?: readonly string[];
};

export type RankedOrganicEcoListing<TListing extends OrganicEcoListing> = TListing & {
  rank: number;
};

export type RankOrganicEcoListingsInput<TListing extends OrganicEcoListing> = {
  listings: readonly TListing[];
  topN?: number;
};

const ORGANIC_ECO_TAGS = new Set([
  'eco',
  'ecological',
  'ekologisk',
  'ekologiska',
  'eko',
  'eu_ecological',
  'krav',
  'organic'
]);

function assertNonBlank(value: string, fieldName: string): void {
  if (!value.trim()) throw new Error(`${fieldName} is required.`);
}

function normalizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function listingTags(listing: OrganicEcoListing): string[] {
  return [...(listing.tags ?? []), ...(listing.labels ?? []), ...(listing.certifications ?? [])];
}

function tagMatchesOrganicEco(value: string): boolean {
  const normalized = normalizeTag(value);
  if (ORGANIC_ECO_TAGS.has(normalized)) return true;
  return normalized.split('_').some((token) => ORGANIC_ECO_TAGS.has(token));
}

function hasOrganicEcoTag(listing: OrganicEcoListing): boolean {
  return listingTags(listing).some(tagMatchesOrganicEco);
}

function validateListing(listing: OrganicEcoListing): void {
  assertNonBlank(listing.promoId, 'promoId');
  assertNonBlank(listing.productId, 'productId');
  assertNonBlank(listing.productName, 'productName');
  if (!Number.isFinite(listing.savings)) throw new Error('savings must be a finite number.');
}

export function rankOrganicEcoListings<TListing extends OrganicEcoListing>(
  input: RankOrganicEcoListingsInput<TListing>
): RankedOrganicEcoListing<TListing>[] {
  const topN = input.topN ?? 10;
  if (!Number.isInteger(topN) || topN <= 0) throw new Error('topN must be a positive integer.');

  return input.listings
    .map((listing) => {
      validateListing(listing);
      return listing;
    })
    .filter(hasOrganicEcoTag)
    .sort((left, right) => {
      if (right.savings !== left.savings) return right.savings - left.savings;
      if (left.productName !== right.productName) return left.productName.localeCompare(right.productName);
      return left.promoId.localeCompare(right.promoId);
    })
    .slice(0, topN)
    .map((listing, index) => ({ ...listing, rank: index + 1 }));
}

export const rankOrganicEcoPromotions = rankOrganicEcoListings;
export default rankOrganicEcoListings;
