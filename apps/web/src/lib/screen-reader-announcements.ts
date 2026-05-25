export type DynamicSurfaceAnnouncement = {
  surface: 'search-autocomplete' | 'filters' | 'deal-verdict' | 'chart-summary' | 'map-list-sync';
  expectedAnnouncement: string;
  wcagSignals: string[];
};

export const screenReaderAnnouncementContracts: DynamicSurfaceAnnouncement[] = [
  {
    surface: 'search-autocomplete',
    expectedAnnouncement: 'Search status, query text, result count, suggestions, and no-result recovery are announced in a polite status region.',
    wcagSignals: ['4.1.2 Name Role Value', '4.1.3 Status Messages']
  },
  {
    surface: 'filters',
    expectedAnnouncement: 'Active filter count, selected dietary filters, no-data, and stale-data states are announced without moving focus.',
    wcagSignals: ['1.3.1 Info and Relationships', '4.1.3 Status Messages']
  },
  {
    surface: 'deal-verdict',
    expectedAnnouncement: 'Deal verdict, current price, freshness, and evidence labels are available as a single non-visual summary.',
    wcagSignals: ['1.3.1 Info and Relationships', '2.4.6 Headings and Labels']
  },
  {
    surface: 'chart-summary',
    expectedAnnouncement: 'Chart window, latest readout, point count, marker count, renderer state, and stale/no-data state are announced.',
    wcagSignals: ['1.1.1 Non-text Content', '4.1.3 Status Messages']
  },
  {
    surface: 'map-list-sync',
    expectedAnnouncement: 'Selected store, list position, total store count, and source caveat are announced when map and list selection sync.',
    wcagSignals: ['1.3.2 Meaningful Sequence', '4.1.3 Status Messages']
  }
];

export function searchAutocompleteAnnouncement(input: {
  error?: boolean;
  hasRecentSearches?: boolean;
  optionCount: number;
  query: string;
  resultCount: number;
  status: 'idle' | 'loading' | 'ready' | 'empty' | 'error';
}): string {
  if (input.status === 'idle') {
    return input.hasRecentSearches
      ? 'Search ready. Recent and saved searches are available.'
      : 'Search ready. Type at least two characters for product suggestions.';
  }
  if (input.status === 'loading') return `Searching for ${input.query}.`;
  if (input.status === 'error' || input.error) return `Search failed for ${input.query}. Try typing another product or brand.`;
  if (input.status === 'empty') return `No verified product results for ${input.query}. Recovery suggestions are available when shown.`;
  return `${input.resultCount} verified product result${input.resultCount === 1 ? '' : 's'} and ${input.optionCount} selectable suggestion${input.optionCount === 1 ? '' : 's'} for ${input.query}.`;
}

export function filterPanelAnnouncement(input: {
  activeFilterCount: number;
  noData?: boolean;
  selectedDietary: readonly string[];
  staleData?: boolean;
}): string {
  const filters = input.activeFilterCount === 0 ? 'No removable filters are active' : `${input.activeFilterCount} removable filter${input.activeFilterCount === 1 ? '' : 's'} active`;
  const dietary = input.selectedDietary.length === 0 ? 'no dietary filters selected' : `${input.selectedDietary.join(', ')} selected`;
  const dataState = input.noData ? 'No matching verified rows.' : input.staleData ? 'Some visible rows may be stale.' : 'Verified rows stay source-backed.';
  return `${filters}; ${dietary}. ${dataState}`;
}

export function dealVerdictAnnouncement(input: {
  currentPriceLabel: string;
  evidenceLabel: string;
  freshnessLabel: string;
  title: string;
  verdict: string;
}): string {
  return `${input.title}. ${input.currentPriceLabel}. Verdict: ${input.verdict}. Freshness: ${input.freshnessLabel}. Evidence: ${input.evidenceLabel}.`;
}

export function chartSummaryAnnouncement(input: {
  chartAvailable: boolean;
  latestReadout: string;
  markerCount: number;
  pointCount: number;
  rendererStatus: string;
  staleData?: boolean;
  title: string;
  windowLabel: string;
}): string {
  if (!input.chartAvailable || input.pointCount === 0) {
    return `${input.title}. No chart data is available for ${input.windowLabel}. Renderer status: ${input.rendererStatus}.`;
  }
  const staleCopy = input.staleData ? ' Some chart data may be stale.' : '';
  return `${input.title}, ${input.windowLabel}. ${input.pointCount} price points and ${input.markerCount} source markers. Latest readout: ${input.latestReadout}. Renderer status: ${input.rendererStatus}.${staleCopy}`;
}

export function mapListSyncAnnouncement(input: {
  selectedStoreName: string;
  selectedStorePosition: number;
  sourceCaveat: string;
  totalStores: number;
}): string {
  return `${input.selectedStoreName} selected, ${input.selectedStorePosition} of ${input.totalStores}. ${input.sourceCaveat}`;
}
