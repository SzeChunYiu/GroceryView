export type YxNoStore = {
  id: string;
  name: string;
  country: 'NO';
  chain: 'YX';
  operator: 'Reitan Convenience Norway';
  url: string;
};

export const yxNoConnector = {
  id: 'yx-no',
  country: 'NO',
  chain: 'YX',
  operator: 'Reitan Convenience Norway',
  homepage: 'https://www.yx.no',
  source: 'https://www.yx.no',
  capabilities: ['fuel', 'convenience'] as const,
  buildStoreUrl(slug: string) {
    return `https://www.yx.no/stasjoner/${encodeURIComponent(slug)}`;
  },
  normalizeStore(slug: string, name: string): YxNoStore {
    return {
      id: `yx-no:${slug}`,
      name,
      country: 'NO',
      chain: 'YX',
      operator: 'Reitan Convenience Norway',
      url: this.buildStoreUrl(slug)
    };
  }
};

export function validateYxNoConnector() {
  const sample = yxNoConnector.normalizeStore('oslo-sentrum', 'YX Oslo Sentrum');

  return sample.country === 'NO'
    && sample.chain === 'YX'
    && sample.operator === 'Reitan Convenience Norway'
    && sample.url === 'https://www.yx.no/stasjoner/oslo-sentrum';
}
