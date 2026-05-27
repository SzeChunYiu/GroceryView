export const MLYN_NO_BRREG_SEARCH_URL = 'https://data.brreg.no/enhetsregisteret/api/enheter?navn=mlyn&size=100';
export const MLYN_NO_PARSER_VERSION = 'mlyn-no-brreg-coverage-v1';
export const MLYN_NO_OBSERVED_REGISTRY_CANDIDATE_COUNT = 24;
export const MLYN_NO_OBSERVED_GROCERY_LIKE_CANDIDATE_COUNT = 0;

const GROCERY_RETAIL_CODE_PATTERN = /^47\.(11|2[1-9])/;
const GROCERY_RETAIL_TEXT_PATTERN = /dagligvare|næringsmidler|matbutikk|butikkhandel med bredt vareutvalg/i;

export type MlynNoRegistryCandidate = {
  country: 'NO';
  chain: 'mlyn-no';
  candidateName: string;
  organizationNumber: string;
  industryCode: string;
  industryDescription: string;
  municipality: string;
  address: string;
  groceryLike: boolean;
  sourceUrl: string;
};

export type MlynNoLocation = never;

export type MlynNoCoverageStatus = {
  chain: 'mlyn-no';
  chainName: 'Mlyn';
  country: 'NO';
  retailer_type: 'ethnic_polish_eastern_european';
  status: 'not_source_backed_as_norway_grocery_chain' | 'needs_manual_review_grocery_like_name_match';
  qualifiesForChainConnector: false;
  qualifiesForLocationConnector: false;
  qualifiesForOnlinePriceConnector: false;
  candidateCount: number;
  groceryLikeCandidateCount: number;
  locations: MlynNoLocation[];
  evidence: Array<{
    kind: 'official_registry_search';
    label: string;
    sourceUrl: string;
  }>;
  caveat: string;
};

export type FetchMlynNoCoverageStatusOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
};

export async function fetchMlynNoCoverageStatus(options: FetchMlynNoCoverageStatusOptions = {}): Promise<MlynNoCoverageStatus> {
  const sourceUrl = options.sourceUrl ?? MLYN_NO_BRREG_SEARCH_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 mlyn-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Mlyn NO registry source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Mlyn NO registry source failed with HTTP ${response.status}.`);

  return buildMlynNoCoverageStatus(parseMlynNoRegistryCandidates(await response.json(), sourceUrl));
}

export async function fetchMlynNoLocations(): Promise<MlynNoLocation[]> {
  return [];
}

export function parseMlynNoRegistryCandidates(payload: unknown, sourceUrl = MLYN_NO_BRREG_SEARCH_URL): MlynNoRegistryCandidate[] {
  const rows = recordAt(payload, ['_embedded']);
  const candidates = Array.isArray(rows?.enheter) ? rows.enheter : [];

  return candidates.map((candidate) => normalizeMlynNoRegistryCandidate(candidate, sourceUrl)).filter((row): row is MlynNoRegistryCandidate => row !== null);
}

export function buildMlynNoCoverageStatus(candidates: readonly MlynNoRegistryCandidate[]): MlynNoCoverageStatus {
  return coverageStatusForCounts(
    candidates.length,
    candidates.filter((candidate) => candidate.groceryLike).length
  );
}

export function verifyMlynNoCoverageStatus(): MlynNoCoverageStatus {
  return coverageStatusForCounts(MLYN_NO_OBSERVED_REGISTRY_CANDIDATE_COUNT, MLYN_NO_OBSERVED_GROCERY_LIKE_CANDIDATE_COUNT);
}

function coverageStatusForCounts(candidateCount: number, groceryLikeCandidateCount: number): MlynNoCoverageStatus {
  const status = groceryLikeCandidateCount > 0 ? 'needs_manual_review_grocery_like_name_match' : 'not_source_backed_as_norway_grocery_chain';

  return {
    chain: 'mlyn-no',
    chainName: 'Mlyn',
    country: 'NO',
    retailer_type: 'ethnic_polish_eastern_european',
    status,
    qualifiesForChainConnector: false,
    qualifiesForLocationConnector: false,
    qualifiesForOnlinePriceConnector: false,
    candidateCount,
    groceryLikeCandidateCount,
    locations: [],
    evidence: [
      {
        kind: 'official_registry_search',
        label: `Brønnøysundregistrene Enhetsregisteret returned ${candidateCount} Mlyn-name candidates; ${groceryLikeCandidateCount} matched grocery-retail industry codes or descriptions.`,
        sourceUrl: MLYN_NO_BRREG_SEARCH_URL
      }
    ],
    caveat: groceryLikeCandidateCount > 0
      ? 'A Mlyn-name registry match now looks grocery-like, but this connector still emits no locations or prices until a source-backed multi-location Eastern European grocery footprint is verified.'
      : 'No official registry evidence currently backs “Mlyn” as a Norwegian multi-location Eastern European grocery chain; the connector records the negative coverage decision rather than inventing stores or prices.'
  };
}

function normalizeMlynNoRegistryCandidate(candidate: unknown, sourceUrl: string): MlynNoRegistryCandidate | null {
  if (!isRecord(candidate)) return null;
  const candidateName = text(candidate.navn);
  const organizationNumber = text(candidate.organisasjonsnummer);
  if (!candidateName || !organizationNumber) return null;

  const industry = recordAt(candidate, ['naeringskode1']);
  const address = recordAt(candidate, ['forretningsadresse']);
  const industryCode = text(industry?.kode);
  const industryDescription = text(industry?.beskrivelse);

  return {
    country: 'NO',
    chain: 'mlyn-no',
    candidateName,
    organizationNumber,
    industryCode,
    industryDescription,
    municipality: text(address?.kommune),
    address: addressLines(address),
    groceryLike: isGroceryLike(industryCode, industryDescription),
    sourceUrl
  };
}

function addressLines(address: Record<string, unknown> | null): string {
  const lines = address?.adresse;
  return Array.isArray(lines) ? lines.map(text).filter(Boolean).join(', ') : '';
}

function isGroceryLike(industryCode: string, industryDescription: string): boolean {
  return GROCERY_RETAIL_CODE_PATTERN.test(industryCode) || GROCERY_RETAIL_TEXT_PATTERN.test(industryDescription);
}

function recordAt(value: unknown, path: readonly string[]): Record<string, unknown> | null {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return isRecord(current) ? current : null;
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
