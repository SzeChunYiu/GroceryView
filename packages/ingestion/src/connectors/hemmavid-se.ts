export type HemmavidSeAssessment = {
  chain: 'hemmavid';
  country: 'SE';
  category: 'health_food';
  includeConnector: false;
  reason: string;
  sources: string[];
};

export const hemmavidSeAssessment: HemmavidSeAssessment = {
  chain: 'hemmavid',
  country: 'SE',
  category: 'health_food',
  includeConnector: false,
  reason:
    'Hemmavid is not a national health-food grocery chain; public pages identify the brand as an online paint and wallpaper retailer. Keep it out of health_food ingestion until a multi-store grocery/health-food footprint is verified.',
  sources: ['https://hemmavid.se/', 'https://www.trustpilot.com/review/hemmavid.se']
};

export async function fetchHemmavidSe(): Promise<never[]> {
  return [];
}
