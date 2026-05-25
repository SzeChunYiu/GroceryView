import type { ChainIndexTrendReport } from '../chain-index-data';

export const willysSourceSummary = {
  source: 'willys.se public search JSON',
  retrievedAt: '2026-05-25T08:05:40.816Z',
  rowCount: 11200,
  sourceUrlPattern: 'https://www.willys.se/search?q={query}',
  sourceUrlCount: 132
};

export const hemkopSourceSummary = {
  source: 'hemkop.se public search JSON',
  retrievedAt: '2026-05-25T08:05:40.816Z',
  rowCount: 11802,
  sourceUrlPattern: 'https://www.hemkop.se/search?q={query}&page={page}&size=100',
  sourceUrlCount: 139
};

export const willysWeeklyDiscountSourceSummary = {
  source: 'willys.se public Axfood campaign JSON',
  retrievedAt: '2026-05-25T08:05:40.816Z',
  rowCount: 46905,
  storeSourceUrl: 'https://www.willys.se/axfood/rest/store',
  sourceUrlPattern: 'https://www.willys.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100',
  storeCount: 254,
  sourceUrlCount: 644
};

export const hemkopWeeklyDiscountSourceSummary = {
  source: 'hemkop.se public Axfood campaign JSON',
  retrievedAt: '2026-05-25T08:05:40.816Z',
  rowCount: 54842,
  storeSourceUrl: 'https://www.hemkop.se/axfood/rest/store',
  sourceUrlPattern: 'https://www.hemkop.se/search/campaigns/offline?q={storeId}&type=PERSONAL_GENERAL&page={page}&size=100',
  storeCount: 205,
  sourceUrlCount: 615
};

export const axfoodWeeklyTrendReport: ChainIndexTrendReport = {
  title: 'Chain Price Index trend chart',
  sourceLabel: 'Willys/Hemköp weekly campaign tape',
  dateCount: 3,
  observationCount: 24461,
  chartWindowLabel: '2026-05-18 -> 2026-05-25',
  coverageLabel: '3 campaign snapshots · 24 461 shared-category observations',
  guardrails: [
    'Uses dated weekly campaign rows from generated Willys and Hemköp Axfood campaign rows.',
    'Snapshot points carry forward only observed campaign rows within a 7-day campaign window.',
    'calculateChainPriceIndex-compatible category ratios run per campaign snapshot date; no forecast or synthetic shelf history is rendered.',
    'This is campaign tape coverage, not a full-store shelf basket time series.'
  ],
  series: [
    {
      chainId: 'Hemköp',
      points: [
        {
          date: '2026-05-18',
          value: 117.5,
          categoriesCovered: 7,
          observations: 31,
          confidence: 'medium'
        },
        {
          date: '2026-05-20',
          value: 198.3,
          categoriesCovered: 1,
          observations: 8,
          confidence: 'low'
        },
        {
          date: '2026-05-25',
          value: 93.1,
          categoriesCovered: 11,
          observations: 8512,
          confidence: 'high'
        }
      ],
      latestIndex: 93.1,
      latestDate: '2026-05-25',
      movementFromFirst: -24.4,
      coverageLabel: '3 dates · 3 coverage levels'
    },
    {
      chainId: 'Willys',
      points: [
        {
          date: '2026-05-18',
          value: 109.6,
          categoriesCovered: 7,
          observations: 1932,
          confidence: 'high'
        },
        {
          date: '2026-05-20',
          value: 100,
          categoriesCovered: 1,
          observations: 12,
          confidence: 'low'
        },
        {
          date: '2026-05-25',
          value: 95.7,
          categoriesCovered: 11,
          observations: 13966,
          confidence: 'high'
        }
      ],
      latestIndex: 95.7,
      latestDate: '2026-05-25',
      movementFromFirst: -13.9,
      coverageLabel: '3 dates · 3 coverage levels'
    }
  ]
};
