import {
  majorSwedishGroceryChainSeeds,
  type MajorSwedishGroceryChainSlug
} from '../seed/retailers.js';

export type RetailerQuery = {
  sql: string;
  values: [supportedRetailerIds: string[]];
};

export type RetailerRow = {
  id: string;
  name: string;
  logo: string;
  website_url: string;
};

export type RetailerMetadata = {
  id: string;
  name: string;
  logo: string;
  websiteUrl: string;
};

export const supportedRetailerIds = ['city-gross', 'coop', 'hemkop', 'ica', 'lidl', 'netto', 'willys'] as const;

const majorSwedishGroceryMetadataBySlug = new Map(majorSwedishGroceryChainSeeds.map((chain) => [chain.slug, chain]));

function seededRetailerMetadata(slug: MajorSwedishGroceryChainSlug): RetailerMetadata {
  const seed = majorSwedishGroceryMetadataBySlug.get(slug);
  if (!seed) throw new Error(`Missing major Swedish grocery chain seed metadata: ${slug}`);
  return {
    id: seed.slug,
    name: seed.name,
    logo: seed.logo,
    websiteUrl: seed.websiteUrl
  };
}

export const supportedRetailerMetadata: Record<typeof supportedRetailerIds[number], RetailerMetadata> = {
  'city-gross': {
    id: 'city-gross',
    name: 'City Gross',
    logo: '/retailers/city-gross.svg',
    websiteUrl: 'https://www.citygross.se/'
  },
  coop: seededRetailerMetadata('coop'),
  hemkop: seededRetailerMetadata('hemkop'),
  ica: seededRetailerMetadata('ica'),
  lidl: seededRetailerMetadata('lidl'),
  netto: seededRetailerMetadata('netto'),
  willys: seededRetailerMetadata('willys')
};

export const supportedRetailers: RetailerMetadata[] = supportedRetailerIds.map((id) => supportedRetailerMetadata[id]);

function sqlCaseFor(field: 'logo' | 'websiteUrl') {
  const column = field === 'logo' ? 'logo' : 'website_url';
  return `case chains.slug
            ${supportedRetailers.map((retailer) => `when '${retailer.id}' then '${field === 'logo' ? retailer.logo : retailer.websiteUrl}'`).join('\n            ')}
            else null
          end as ${column}`;
}

export function buildRetailersQuery(): RetailerQuery {
  return {
    sql: `select chains.slug as id,
                 chains.name,
                 ${sqlCaseFor('logo')},
                 coalesce(chains.website_url, ${sqlCaseFor('websiteUrl').replace(' as website_url', '')}) as website_url
          from chains
          where chains.slug = any($1::text[])
          order by array_position($1::text[], chains.slug), chains.name`,
    values: [[...supportedRetailerIds]]
  };
}

export function mapRetailerRow(row: RetailerRow): RetailerMetadata {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo,
    websiteUrl: row.website_url
  };
}
