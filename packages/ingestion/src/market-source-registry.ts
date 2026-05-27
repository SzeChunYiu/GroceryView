export type MarketSourceTermsStatus = 'approved' | 'pending' | 'blocked' | 'unknown';

export type MarketSourceAccessMethod =
  | 'official_api'
  | 'retailer_online_page'
  | 'flyer_campaign'
  | 'public_dataset'
  | 'operator_public_page';

export type MarketSourceCredentialRequirement = 'none' | 'api_key' | 'partner_agreement' | 'service_account';

export type MarketSourceRegistryEntry = {
  sourceId: string;
  connectorIds: string[];
  market: string;
  chainId: string;
  displayName: string;
  accessMethod: MarketSourceAccessMethod;
  allowedEndpointUrlPrefixes?: string[];
  termsStatus: MarketSourceTermsStatus;
  termsUrl?: string;
  robotsTxtStatus: 'allow' | 'disallow' | 'not_applicable' | 'unknown';
  rateLimit: string;
  credentials: MarketSourceCredentialRequirement;
  coverage: string;
  owner: string;
  canRunInProduction: boolean;
  checkedAt: string;
  notes: string;
};

export type MarketSourceTermsGateInput = {
  connectorId: string;
  chainId: string;
  sourceType: string;
  endpointUrl?: string;
  market?: string;
  allowDevOverride?: boolean;
};

export type MarketSourceTermsGatePlan = {
  status: 'allowed' | 'blocked' | 'dev_override';
  connectorId: string;
  chainId: string;
  market: string;
  sourceId?: string;
  termsStatus: MarketSourceTermsStatus;
  requiredActions: string[];
  reason: string;
};

export const marketSourceRegistry: MarketSourceRegistryEntry[] = [
  {
    sourceId: 'se:ica:store-promotions-default-stores',
    connectorIds: ['ica-store-promotions-default-stores'],
    market: 'SE',
    chainId: 'ica',
    displayName: 'ICA store promotions default stores',
    accessMethod: 'official_api',
    allowedEndpointUrlPrefixes: ['groceryview://daily/ica/store-promotions/default-stores'],
    termsStatus: 'approved',
    termsUrl: 'https://www.ica.se/',
    robotsTxtStatus: 'not_applicable',
    rateLimit: 'Bounded daily store batch; worker-level connector concurrency applies.',
    credentials: 'partner_agreement',
    coverage: 'Sweden default-store promotion endpoints with source-run provenance.',
    owner: 'Data Ops - ICA promotions',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Approved daily source configuration requires data agreement evidence before production use.'
  },
  {
    sourceId: 'se:willys:products-all-stores',
    connectorIds: ['willys-products-all-stores'],
    market: 'SE',
    chainId: 'willys',
    displayName: 'Willys products all stores',
    accessMethod: 'official_api',
    allowedEndpointUrlPrefixes: ['groceryview://daily/willys/products/all-stores'],
    termsStatus: 'approved',
    termsUrl: 'https://www.willys.se/',
    robotsTxtStatus: 'not_applicable',
    rateLimit: 'Bounded daily all-store batch with connector and store concurrency controls.',
    credentials: 'partner_agreement',
    coverage: 'Sweden Willys branch-scoped product price snapshots.',
    owner: 'Data Ops - Axfood',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Allowed only through the registered groceryview:// daily endpoint.'
  },
  {
    sourceId: 'se:willys:weekly-all-stores',
    connectorIds: ['willys-weekly-all-stores'],
    market: 'SE',
    chainId: 'willys',
    displayName: 'Willys weekly offers all stores',
    accessMethod: 'flyer_campaign',
    allowedEndpointUrlPrefixes: ['groceryview://daily/willys/weekly-offers/all-stores'],
    termsStatus: 'approved',
    termsUrl: 'https://www.willys.se/',
    robotsTxtStatus: 'not_applicable',
    rateLimit: 'Daily campaign refresh, bounded by weekly-offer connector controls.',
    credentials: 'partner_agreement',
    coverage: 'Sweden Willys weekly campaign offers by store.',
    owner: 'Data Ops - Axfood',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Campaign ingestion stays separate from shelf-price product snapshots.'
  },
  {
    sourceId: 'se:coop:products-all-stores',
    connectorIds: ['coop-products-all-stores'],
    market: 'SE',
    chainId: 'coop',
    displayName: 'Coop products all stores',
    accessMethod: 'official_api',
    allowedEndpointUrlPrefixes: ['groceryview://daily/coop/products/all-stores'],
    termsStatus: 'approved',
    termsUrl: 'https://www.coop.se/',
    robotsTxtStatus: 'not_applicable',
    rateLimit: 'Bounded daily all-store batch with store filtering for online prices.',
    credentials: 'partner_agreement',
    coverage: 'Sweden Coop product prices for stores that expose online product prices.',
    owner: 'Data Ops - Coop',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Registered source requires the store filter emitted by the daily connector generator.'
  },
  {
    sourceId: 'se:coop:weekly-all-stores',
    connectorIds: ['coop-weekly-all-stores'],
    market: 'SE',
    chainId: 'coop',
    displayName: 'Coop weekly offers all stores',
    accessMethod: 'flyer_campaign',
    allowedEndpointUrlPrefixes: ['groceryview://daily/coop/weekly-offers/all-stores'],
    termsStatus: 'approved',
    termsUrl: 'https://www.coop.se/',
    robotsTxtStatus: 'not_applicable',
    rateLimit: 'Daily campaign refresh, bounded by weekly-offer connector controls.',
    credentials: 'partner_agreement',
    coverage: 'Sweden Coop weekly campaign offers by store.',
    owner: 'Data Ops - Coop',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Campaign source is registry-gated independently from Coop product prices.'
  },
  {
    sourceId: 'se:hemkop:products-all-stores',
    connectorIds: ['hemkop-products-all-stores'],
    market: 'SE',
    chainId: 'hemkop',
    displayName: 'Hemkop products all stores',
    accessMethod: 'official_api',
    allowedEndpointUrlPrefixes: ['groceryview://daily/hemkop/products/all-stores'],
    termsStatus: 'approved',
    termsUrl: 'https://www.hemkop.se/',
    robotsTxtStatus: 'not_applicable',
    rateLimit: 'Bounded daily all-store batch with connector and store concurrency controls.',
    credentials: 'partner_agreement',
    coverage: 'Sweden Hemkop branch-scoped product price snapshots.',
    owner: 'Data Ops - Axfood',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Allowed only through the registered groceryview:// daily endpoint.'
  },
  {
    sourceId: 'se:hemkop:weekly-all-stores',
    connectorIds: ['hemkop-weekly-all-stores'],
    market: 'SE',
    chainId: 'hemkop',
    displayName: 'Hemkop weekly offers all stores',
    accessMethod: 'flyer_campaign',
    allowedEndpointUrlPrefixes: ['groceryview://daily/hemkop/weekly-offers/all-stores'],
    termsStatus: 'approved',
    termsUrl: 'https://www.hemkop.se/',
    robotsTxtStatus: 'not_applicable',
    rateLimit: 'Daily campaign refresh, bounded by weekly-offer connector controls.',
    credentials: 'partner_agreement',
    coverage: 'Sweden Hemkop weekly campaign offers by store.',
    owner: 'Data Ops - Axfood',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Campaign ingestion stays separate from shelf-price product snapshots.'
  },
  {
    sourceId: 'se:lidl:public-offers-all-stores',
    connectorIds: ['lidl-public-offers-all-stores'],
    market: 'SE',
    chainId: 'lidl',
    displayName: 'Lidl public offers all stores',
    accessMethod: 'retailer_online_page',
    allowedEndpointUrlPrefixes: ['groceryview://daily/lidl/public-offers/all-stores'],
    termsStatus: 'approved',
    termsUrl: 'https://www.lidl.se/',
    robotsTxtStatus: 'allow',
    rateLimit: 'Daily public-offer refresh with explicit max-store controls.',
    credentials: 'none',
    coverage: 'Sweden Lidl public weekly offer pages linked to store evidence.',
    owner: 'Data Ops - Lidl public offers',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Robots and legal status must stay approved for page-based ingestion.'
  },
  {
    sourceId: 'se:city-gross:products-bulk',
    connectorIds: ['city-gross-products-bulk'],
    market: 'SE',
    chainId: 'city_gross',
    displayName: 'City Gross products bulk',
    accessMethod: 'official_api',
    allowedEndpointUrlPrefixes: ['groceryview://daily/city-gross/products/bulk'],
    termsStatus: 'approved',
    termsUrl: 'https://www.citygross.se/',
    robotsTxtStatus: 'not_applicable',
    rateLimit: 'Bulk connector minimum-row guard plus daily worker retry limits.',
    credentials: 'partner_agreement',
    coverage: 'Sweden City Gross bulk product and price snapshots.',
    owner: 'Data Ops - City Gross',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Registered as the required City Gross daily chain connector.'
  },
  {
    sourceId: 'se:mathem:public-search',
    connectorIds: ['mathem-public-search'],
    market: 'SE',
    chainId: 'mathem',
    displayName: 'Mathem public search',
    accessMethod: 'retailer_online_page',
    allowedEndpointUrlPrefixes: ['groceryview://daily/mathem/products/public-search'],
    termsStatus: 'approved',
    termsUrl: 'https://www.mathem.se/',
    robotsTxtStatus: 'allow',
    rateLimit: 'Small query set, daily refresh, no store-scoped price requirement.',
    credentials: 'none',
    coverage: 'Sweden public search sample rows for catalog comparison evidence.',
    owner: 'Data Ops - public search',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Public search source must not be promoted as all-store coverage.'
  },
  {
    sourceId: 'se:matspar:public-search',
    connectorIds: ['matspar-public-search'],
    market: 'SE',
    chainId: 'matspar',
    displayName: 'Matspar public search',
    accessMethod: 'retailer_online_page',
    allowedEndpointUrlPrefixes: ['groceryview://daily/matspar/products/public-search'],
    termsStatus: 'approved',
    termsUrl: 'https://www.matspar.se/',
    robotsTxtStatus: 'allow',
    rateLimit: 'Small query set, daily refresh, no store-scoped price requirement.',
    credentials: 'none',
    coverage: 'Sweden public search sample rows for catalog comparison evidence.',
    owner: 'Data Ops - public search',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Public search source must not be promoted as all-store coverage.'
  },
  {
    sourceId: 'se:pharmacy:public-products',
    connectorIds: ['pharmacy-public-products'],
    market: 'SE',
    chainId: 'pharmacy',
    displayName: 'Sweden pharmacy public products',
    accessMethod: 'retailer_online_page',
    allowedEndpointUrlPrefixes: ['groceryview://daily/pharmacy/products/public'],
    termsStatus: 'approved',
    termsUrl: 'https://www.apotekhjartat.se/',
    robotsTxtStatus: 'allow',
    rateLimit: 'Bounded public product paths with no store-scoped price claims.',
    credentials: 'none',
    coverage: 'Sweden public OTC pharmacy catalog evidence.',
    owner: 'Data Ops - pharmacy',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Pharmacy domain rows remain separated from grocery price comparisons.'
  },
  {
    sourceId: 'se:apoteket:public-products',
    connectorIds: ['apoteket-se-public-products'],
    market: 'SE',
    chainId: 'apoteket',
    displayName: 'Apoteket public products',
    accessMethod: 'retailer_online_page',
    allowedEndpointUrlPrefixes: ['groceryview://daily/apoteket-se/products/public'],
    termsStatus: 'approved',
    termsUrl: 'https://www.apoteket.se/',
    robotsTxtStatus: 'allow',
    rateLimit: 'Bounded public product URLs with no store-scoped price claims.',
    credentials: 'none',
    coverage: 'Sweden Apoteket public OTC product evidence.',
    owner: 'Data Ops - pharmacy',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Pharmacy domain rows remain separated from grocery price comparisons.'
  },
  {
    sourceId: 'se:okq8:fuel-prices',
    connectorIds: ['okq8-fuel-prices'],
    market: 'SE',
    chainId: 'okq8',
    displayName: 'OKQ8 fuel prices',
    accessMethod: 'operator_public_page',
    allowedEndpointUrlPrefixes: ['https://www.okq8.se/foretag/priser/'],
    termsStatus: 'approved',
    termsUrl: 'https://www.okq8.se/foretag/priser/',
    robotsTxtStatus: 'allow',
    rateLimit: 'Daily operator-price page fetch with page outage annotation.',
    credentials: 'none',
    coverage: 'Sweden OKQ8 public business fuel price page.',
    owner: 'Mobility price ops',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Fuel domain rows remain separated from grocery price comparisons.'
  },
  {
    sourceId: 'se:preem:business-list-prices',
    connectorIds: ['preem-se-business-list-prices'],
    market: 'SE',
    chainId: 'preem',
    displayName: 'Preem business list prices',
    accessMethod: 'operator_public_page',
    allowedEndpointUrlPrefixes: ['https://www.preem.se/foretag/listpriser/'],
    termsStatus: 'approved',
    termsUrl: 'https://www.preem.se/foretag/listpriser/',
    robotsTxtStatus: 'allow',
    rateLimit: 'Daily operator-price page fetch with page outage annotation.',
    credentials: 'none',
    coverage: 'Sweden Preem public business fuel list prices.',
    owner: 'Mobility price ops',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Fuel domain rows remain separated from grocery price comparisons.'
  },
  {
    sourceId: 'is:ob:fuel-prices',
    connectorIds: ['ob-is-fuel-prices'],
    market: 'IS',
    chainId: 'ob-is',
    displayName: 'OB Iceland fuel prices',
    accessMethod: 'operator_public_page',
    allowedEndpointUrlPrefixes: ['https://olis.ob.is/eldsneytisverd'],
    termsStatus: 'approved',
    termsUrl: 'https://olis.ob.is/eldsneytisverd',
    robotsTxtStatus: 'allow',
    rateLimit: 'Daily operator-price page fetch with page outage annotation.',
    credentials: 'none',
    coverage: 'Iceland OB public fuel price page.',
    owner: 'Mobility price ops',
    canRunInProduction: true,
    checkedAt: '2026-05-25',
    notes: 'Fuel domain rows remain separated from grocery price comparisons.'
  },
  {
    sourceId: 'no:rema-1000:search-review',
    connectorIds: ['rema-1000-no-search'],
    market: 'NO',
    chainId: 'rema_1000_no',
    displayName: 'REMA 1000 Norway public search review',
    accessMethod: 'retailer_online_page',
    termsStatus: 'pending',
    termsUrl: 'https://oda.com/no/',
    robotsTxtStatus: 'unknown',
    rateLimit: 'No production rate limit approved.',
    credentials: 'none',
    coverage: 'Norway search/source review only; no production connector is approved.',
    owner: 'Data Ops - Norway readiness',
    canRunInProduction: false,
    checkedAt: '2026-05-25',
    notes: 'Registry entry documents pending status so a worker cannot silently add this source.'
  },
  {
    sourceId: 'is:starter-basket:manual-review',
    connectorIds: ['iceland-starter-basket-manual-review'],
    market: 'IS',
    chainId: 'iceland_starter_basket',
    displayName: 'Iceland starter basket manual source review',
    accessMethod: 'public_dataset',
    termsStatus: 'unknown',
    robotsTxtStatus: 'unknown',
    rateLimit: 'No production ingestion allowed.',
    credentials: 'none',
    coverage: 'Manual starter-basket planning source; not a live price ingestion feed.',
    owner: 'Data Ops - Iceland readiness',
    canRunInProduction: false,
    checkedAt: '2026-05-25',
    notes: 'Unknown status is intentionally blocked until source ownership and terms are approved.'
  }
];

export function findMarketSourceRegistryEntry(
  input: Pick<MarketSourceTermsGateInput, 'connectorId' | 'endpointUrl' | 'chainId' | 'market'>
): MarketSourceRegistryEntry | undefined {
  const connectorId = input.connectorId.trim().toLowerCase();
  const chainId = input.chainId.trim().toLowerCase().replace(/-/g, '_');
  const market = input.market?.trim().toUpperCase();

  return marketSourceRegistry.find((entry) => {
    if (entry.connectorIds.some((candidate) => candidate.toLowerCase() === connectorId)) return true;
    if (market && entry.market !== market) return false;
    return entry.chainId.toLowerCase() === chainId && entry.connectorIds.some((candidate) => candidate.toLowerCase() === connectorId);
  });
}

export function planMarketSourceTermsGate(input: MarketSourceTermsGateInput): MarketSourceTermsGatePlan {
  const entry = findMarketSourceRegistryEntry(input);
  const requiredActions: string[] = [];
  if (!entry) requiredActions.push('market_source_registry_entry_required');

  if (entry) {
    if (entry.termsStatus !== 'approved') requiredActions.push(`terms_status_${entry.termsStatus}_requires_approval`);
    if (!entry.canRunInProduction) requiredActions.push('production_source_approval_required');
    if (
      input.endpointUrl &&
      entry.allowedEndpointUrlPrefixes &&
      !entry.allowedEndpointUrlPrefixes.some((prefix) => input.endpointUrl?.startsWith(prefix))
    ) {
      requiredActions.push('registered_endpoint_url_required');
    }
    if (entry.accessMethod === 'official_api' && input.sourceType !== 'official_api') requiredActions.push('registered_access_method_mismatch');
    if (entry.accessMethod === 'flyer_campaign' && input.sourceType !== 'flyer_campaign') requiredActions.push('registered_access_method_mismatch');
    if (
      (entry.accessMethod === 'retailer_online_page' || entry.accessMethod === 'operator_public_page') &&
      input.sourceType !== 'retailer_online_page'
    ) {
      requiredActions.push('registered_access_method_mismatch');
    }
  }

  if (requiredActions.length === 0 && entry) {
    return {
      status: 'allowed',
      connectorId: input.connectorId,
      chainId: input.chainId,
      market: entry.market,
      sourceId: entry.sourceId,
      termsStatus: entry.termsStatus,
      requiredActions,
      reason: 'Market source registry terms gate allowed this connector.'
    };
  }

  if (input.allowDevOverride) {
    return {
      status: 'dev_override',
      connectorId: input.connectorId,
      chainId: input.chainId,
      market: entry?.market ?? input.market?.trim().toUpperCase() ?? 'UNKNOWN',
      sourceId: entry?.sourceId,
      termsStatus: entry?.termsStatus ?? 'unknown',
      requiredActions,
      reason: 'Development override allowed a connector that is blocked by the market source terms gate.'
    };
  }

  return {
    status: 'blocked',
    connectorId: input.connectorId,
    chainId: input.chainId,
    market: entry?.market ?? input.market?.trim().toUpperCase() ?? 'UNKNOWN',
    sourceId: entry?.sourceId,
    termsStatus: entry?.termsStatus ?? 'unknown',
    requiredActions,
    reason: entry
      ? `Market source terms gate blocked ${input.connectorId}: ${entry.displayName} is ${entry.termsStatus}.`
      : `Market source terms gate blocked ${input.connectorId}: no registry entry exists for this source.`
  };
}

export function assertMarketSourceTermsGate(input: MarketSourceTermsGateInput): MarketSourceTermsGatePlan {
  const plan = planMarketSourceTermsGate(input);
  if (plan.status === 'blocked') {
    throw new Error(`${plan.reason} Required actions: ${plan.requiredActions.join(', ')}.`);
  }
  return plan;
}

export const marketSourceTermsDashboard = marketSourceRegistry.map((entry) => ({
  sourceId: entry.sourceId,
  market: entry.market,
  chainId: entry.chainId,
  displayName: entry.displayName,
  accessMethod: entry.accessMethod,
  termsStatus: entry.termsStatus,
  robotsTxtStatus: entry.robotsTxtStatus,
  rateLimit: entry.rateLimit,
  credentials: entry.credentials,
  coverage: entry.coverage,
  owner: entry.owner,
  canRunInProduction: entry.canRunInProduction,
  checkedAt: entry.checkedAt
}));
