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

export const supportedRetailerIds = ['city-gross', 'coop', 'hemkop', 'ica', 'lidl', 'willys'] as const;

export const supportedRetailerMetadata: Record<typeof supportedRetailerIds[number], RetailerMetadata> = {
  'city-gross': {
    id: 'city-gross',
    name: 'City Gross',
    logo: '/retailers/city-gross.svg',
    websiteUrl: 'https://www.citygross.se/'
  },
  coop: {
    id: 'coop',
    name: 'Coop',
    logo: '/retailers/coop.svg',
    websiteUrl: 'https://www.coop.se/'
  },
  hemkop: {
    id: 'hemkop',
    name: 'Hemköp',
    logo: '/retailers/hemkop.svg',
    websiteUrl: 'https://www.hemkop.se/'
  },
  ica: {
    id: 'ica',
    name: 'ICA',
    logo: '/retailers/ica.svg',
    websiteUrl: 'https://www.ica.se/'
  },
  lidl: {
    id: 'lidl',
    name: 'Lidl',
    logo: '/retailers/lidl.svg',
    websiteUrl: 'https://www.lidl.se/'
  },
  willys: {
    id: 'willys',
    name: 'Willys',
    logo: '/retailers/willys.svg',
    websiteUrl: 'https://www.willys.se/'
  }
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
