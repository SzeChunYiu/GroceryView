export type NordicCountryCode = 'SE' | 'NO' | 'DK' | 'FI' | 'IS';

export type UnifiedCategory =
  | 'baby'
  | 'bakery'
  | 'beverages'
  | 'convenience_snacks'
  | 'dairy'
  | 'frozen'
  | 'fuel'
  | 'household'
  | 'meat_fish'
  | 'pantry'
  | 'personal_care'
  | 'pet'
  | 'pharmacy_otc'
  | 'produce'
  | 'ready_meals';

export type CategoryLabelMapping = {
  chain: string;
  country: NordicCountryCode;
  labels: Record<string, UnifiedCategory>;
};

export type CategoryCoverageAudit = {
  requiredCategories: UnifiedCategory[];
  coveredCategories: UnifiedCategory[];
  missingRequiredCategories: UnifiedCategory[];
  unmappedLabels: Array<{ chain: string; country: NordicCountryCode; label: string }>;
};

export const requiredP0Categories: UnifiedCategory[] = [
  'baby',
  'bakery',
  'beverages',
  'convenience_snacks',
  'dairy',
  'frozen',
  'fuel',
  'household',
  'meat_fish',
  'pantry',
  'personal_care',
  'pet',
  'pharmacy_otc',
  'produce',
  'ready_meals'
];

export const nordicCategoryMappings: CategoryLabelMapping[] = [
  {
    country: 'SE',
    chain: 'ICA',
    labels: {
      'Apotek & receptfritt': 'pharmacy_otc',
      Barn: 'baby',
      'Bröd & bageri': 'bakery',
      'Chips, godis & snacks': 'convenience_snacks',
      Drivmedel: 'fuel',
      'Dryck': 'beverages',
      'Frukt & grönt': 'produce',
      'Färdigmat': 'ready_meals',
      'Frys': 'frozen',
      Husdjur: 'pet',
      Hushåll: 'household',
      Kiosk: 'convenience_snacks',
      'Kött, chark & fisk': 'meat_fish',
      Mejeri: 'dairy',
      Skafferi: 'pantry'
    }
  },
  {
    country: 'SE',
    chain: 'Willys',
    labels: {
      Apotek: 'pharmacy_otc',
      'Barn & baby': 'baby',
      Bröd: 'bakery',
      Dricka: 'beverages',
      Fryst: 'frozen',
      'Frukt och grönt': 'produce',
      Godis: 'convenience_snacks',
      Husdjur: 'pet',
      Kioskvaror: 'convenience_snacks',
      Kolonial: 'pantry',
      'Kött och fisk': 'meat_fish',
      Mejeri: 'dairy',
      'Städ & hushåll': 'household'
    }
  },
  {
    country: 'NO',
    chain: 'Kiwi',
    labels: {
      Apotekvarer: 'pharmacy_otc',
      Bakeri: 'bakery',
      Barn: 'baby',
      Dagligvarer: 'pantry',
      Drikke: 'beverages',
      Drivstoff: 'fuel',
      Dyremat: 'pet',
      Ferskvarer: 'meat_fish',
      Frukt: 'produce',
      Kiosk: 'convenience_snacks',
      Meieri: 'dairy',
      Snacks: 'convenience_snacks',
      'Vask og husholdning': 'household'
    }
  },
  {
    country: 'NO',
    chain: 'Circle K Norge',
    labels: {
      Bilpleie: 'household',
      Drivstoff: 'fuel',
      Kiosk: 'convenience_snacks',
      Mat: 'ready_meals',
      'Reseptfritt': 'pharmacy_otc',
      Snacks: 'convenience_snacks'
    }
  },
  {
    country: 'DK',
    chain: 'Netto',
    labels: {
      Apotek: 'pharmacy_otc',
      Baby: 'baby',
      Brød: 'bakery',
      Brændstof: 'fuel',
      Drikkevarer: 'beverages',
      Frost: 'frozen',
      Frugt: 'produce',
      Husholdning: 'household',
      Kæledyr: 'pet',
      Kioskvarer: 'convenience_snacks',
      Kolonial: 'pantry',
      'Kød & fisk': 'meat_fish',
      Mejeri: 'dairy',
      Slik: 'convenience_snacks'
    }
  },
  {
    country: 'DK',
    chain: 'Matas',
    labels: {
      'Håndkøbsmedicin': 'pharmacy_otc',
      PersonligPleje: 'personal_care',
      Snacks: 'convenience_snacks'
    }
  },
  {
    country: 'FI',
    chain: 'K-Market',
    labels: {
      Apteekki: 'pharmacy_otc',
      Hedelmät: 'produce',
      Juomat: 'beverages',
      Leipä: 'bakery',
      Lemmikit: 'pet',
      Liha: 'meat_fish',
      Maitotuotteet: 'dairy',
      Makeiset: 'convenience_snacks',
      Pakasteet: 'frozen',
      Polttoaine: 'fuel',
      Snacksit: 'convenience_snacks',
      Talous: 'household',
      Valmisruoka: 'ready_meals'
    }
  },
  {
    country: 'FI',
    chain: 'ABC',
    labels: {
      Apteekki: 'pharmacy_otc',
      Kahvila: 'ready_meals',
      Kioski: 'convenience_snacks',
      Polttoaine: 'fuel',
      Välipalat: 'convenience_snacks'
    }
  },
  {
    country: 'IS',
    chain: 'Bónus',
    labels: {
      Apótek: 'pharmacy_otc',
      Barnavörur: 'baby',
      Brauð: 'bakery',
      Drykkir: 'beverages',
      Eldsneyti: 'fuel',
      Heimili: 'household',
      Gæludýr: 'pet',
      Kjöt: 'meat_fish',
      Mjólkurvörur: 'dairy',
      Nesti: 'convenience_snacks',
      Sælgæti: 'convenience_snacks',
      'Ávextir og grænmeti': 'produce'
    }
  },
  {
    country: 'IS',
    chain: 'Olís',
    labels: {
      Bílavörur: 'household',
      Eldsneyti: 'fuel',
      Nesti: 'convenience_snacks',
      Skyndibiti: 'ready_meals',
      'Lyf án lyfseðils': 'pharmacy_otc'
    }
  }
];

export const knownUnmappedCategoryLabels: CategoryCoverageAudit['unmappedLabels'] = [];

function normalizeCategoryLabel(value: string) {
  return value
    .toLocaleLowerCase('sv-SE')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function mapCategoryLabel(country: NordicCountryCode, chain: string, label: string): UnifiedCategory | null {
  const mapping = nordicCategoryMappings.find((candidate) => (
    candidate.country === country && normalizeCategoryLabel(candidate.chain) === normalizeCategoryLabel(chain)
  ));
  if (!mapping) return null;

  const normalizedLabel = normalizeCategoryLabel(label);
  const matchedEntry = Object.entries(mapping.labels).find(([sourceLabel]) => normalizeCategoryLabel(sourceLabel) === normalizedLabel);
  return matchedEntry?.[1] ?? null;
}

export function auditCategoryCoverage(observedLabels: Array<{ chain: string; country: NordicCountryCode; label: string }> = []): CategoryCoverageAudit {
  const coveredCategories = [...new Set(nordicCategoryMappings.flatMap((mapping) => Object.values(mapping.labels)))].sort();
  const unmappedLabels = observedLabels.filter((item) => mapCategoryLabel(item.country, item.chain, item.label) === null);

  return {
    requiredCategories: [...requiredP0Categories],
    coveredCategories,
    missingRequiredCategories: requiredP0Categories.filter((category) => !coveredCategories.includes(category)),
    unmappedLabels
  };
}
