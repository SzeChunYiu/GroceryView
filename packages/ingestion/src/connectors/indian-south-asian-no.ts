export type IndianSouthAsianNoGrocer = {
  id: string;
  name: string;
  country: 'NO';
  category: 'ethnic_indian_south_asian';
  website?: string;
  locations: IndianSouthAsianNoLocation[];
  multiLocation: boolean;
  evidenceUrl: string;
  notes: string;
};

export type IndianSouthAsianNoLocation = {
  label: string;
  address: string;
  city: string;
};

export const INDIAN_SOUTH_ASIAN_NO_CONNECTOR = {
  id: 'indian-south-asian-no',
  country: 'NO',
  category: 'ethnic_indian_south_asian',
  source: 'curated-web-research'
} as const;

export const indianSouthAsianNoGrocers: IndianSouthAsianNoGrocer[] = [
  {
    id: 'scanasia',
    name: 'Scanasia',
    country: 'NO',
    category: 'ethnic_indian_south_asian',
    website: 'https://www.scanasia.no/',
    evidenceUrl: 'https://www.scanasia.no/kontakt-oss',
    multiLocation: true,
    notes: 'Asian import/distribution business with public retail departments at Storgata and Stovner plus the Brobekkveien warehouse address; included as multi-location South/East Asian specialty coverage candidate.',
    locations: [
      { label: 'Scanasia AS', address: 'Brobekkveien 107, 0582 Oslo', city: 'Oslo' },
      { label: 'Scanasia avd Storgata', address: 'Storgata 27, 0184 Oslo', city: 'Oslo' },
      { label: 'Scanasia avd Stovner', address: 'Stovner Senter 3, 0985 Oslo', city: 'Oslo' }
    ]
  },
  {
    id: 'a-food-market',
    name: 'A Food Market',
    country: 'NO',
    category: 'ethnic_indian_south_asian',
    website: 'https://afood.no/',
    evidenceUrl: 'https://mappno.com/a-food-market-i13411156.html',
    multiLocation: true,
    notes: 'Asian Food Import retail format with Oslo stores referenced at Osterhaus gate and Grønland/Lakkegata; carries pan-Asian groceries and is a practical South-Asian ingredient source.',
    locations: [
      { label: 'A Food Market Osterhaus gate', address: "Osterhaus' gate 8, 0183 Oslo", city: 'Oslo' },
      { label: 'A Food Market Grønland', address: 'Lakkegata 3, 0187 Oslo', city: 'Oslo' }
    ]
  },
  {
    id: 'abiramy-cash-carry',
    name: 'Abiramy Cash & Carry',
    country: 'NO',
    category: 'ethnic_indian_south_asian',
    website: 'https://abiramyoslo.no/',
    evidenceUrl: 'https://norgeguide.com/en/oslo/matbutikker-og-supermarkeder/abiramy-cash-carry/',
    multiLocation: false,
    notes: 'Oslo South Asian grocery/wholesale candidate; strong Indian/Sri Lankan/Bangladeshi/Nepali assortment but only one public location found.',
    locations: [
      { label: 'Abiramy Cash & Carry', address: 'Veitvetveien 8, 0596 Oslo', city: 'Oslo' }
    ]
  },
  {
    id: 'norbygata-dagligvare',
    name: 'Norbygata Dagligvare',
    country: 'NO',
    category: 'ethnic_indian_south_asian',
    evidenceUrl: 'https://www.norgebiz.com/norbygata-grocery-as-909-95-633',
    multiLocation: false,
    notes: 'Oslo international grocery with Indian/Pakistani assortment; single public location, so track as candidate rather than multi-location chain.',
    locations: [
      { label: 'Norbygata Dagligvare', address: 'Tøyengata 3, 0190 Oslo', city: 'Oslo' }
    ]
  },
  {
    id: 'galgeberg-dagligvare',
    name: 'Galgeberg Dagligvare',
    country: 'NO',
    category: 'ethnic_indian_south_asian',
    website: 'https://galdag.no/',
    evidenceUrl: 'https://galdag.no/',
    multiLocation: false,
    notes: 'Bangladeshi/Bengali and international grocery candidate; single public location found.',
    locations: [
      { label: 'Galgeberg Dagligvare', address: 'Galgeberg 3, 0657 Oslo', city: 'Oslo' }
    ]
  }
];

export function listIndianSouthAsianNoGrocers(options: { multiLocationOnly?: boolean } = {}): IndianSouthAsianNoGrocer[] {
  return indianSouthAsianNoGrocers.filter((grocer) => !options.multiLocationOnly || grocer.multiLocation);
}
