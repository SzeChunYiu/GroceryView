export type IndianSouthAsianNoCandidate = {
  name: string;
  city: string;
  footprint: 'single_location' | 'unverified_multi_location';
  source: string;
};

export type IndianSouthAsianNoAssessment = {
  category: 'ethnic_indian_south_asian';
  country: 'NO';
  includeConnector: false;
  reason: string;
  candidates: IndianSouthAsianNoCandidate[];
};

export const indianSouthAsianNoAssessment: IndianSouthAsianNoAssessment = {
  category: 'ethnic_indian_south_asian',
  country: 'NO',
  includeConnector: false,
  reason:
    'No multi-location Indian/South-Asian grocery chain in Norway was verified from public sources. Current evidence points to independent single-location international/South-Asian grocers, so ingestion should wait until a repeatable chain or national online catalogue is identified.',
  candidates: [
    {
      name: 'Abiramy Cash & Carry',
      city: 'Oslo',
      footprint: 'single_location',
      source: 'https://abiramyoslo.no/'
    },
    {
      name: 'Pak-Matcenter',
      city: 'Oslo',
      footprint: 'single_location',
      source: 'https://www.yellowpages.net/phone-47-22195060-indian-grocery-store-Oslo-NO6603.html'
    },
    {
      name: 'IMS Internasjonalt Matsenter Hillevåg',
      city: 'Stavanger',
      footprint: 'single_location',
      source: 'https://ims.as/'
    },
    {
      name: 'Galgeberg Dagligvare',
      city: 'Oslo',
      footprint: 'single_location',
      source: 'https://galdag.no/'
    }
  ]
};

export async function fetchIndianSouthAsianNo(): Promise<never[]> {
  return [];
}
