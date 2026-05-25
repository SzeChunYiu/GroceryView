// AUTO-GENERATED from live retailer ingestion by scripts/ingestion/generate-live-retailer-ingested.mjs.
// Generated at: 2026-05-25T08:05:40.816Z
// Compare store capability row count: 6
import type { IcaReklambladIngestedOffer } from '../ingested/ica-reklamblad';
import type { LidlIngestedStoreOffer } from '../ingested/lidl';
import type { MathemIngestedProduct } from '../ingested/mathem';
import type { MatpriskollenIngestedOffer } from '../ingested/matpriskollen';

export type DbSiteCompareStoreCapability = {
  chainId: string;
  coupon: boolean;
  delivery: boolean;
  pickup: boolean;
  evidenceLabel: string;
  evidenceUpdatedAt: string | null;
};

export const dbSiteIngestedOverridesGeneratedAt = "2026-05-25T08:05:40.816Z";

export const dbSiteMatpriskollenOffers: MatpriskollenIngestedOffer[] = [];
export const dbSiteLidlStoreOffers: LidlIngestedStoreOffer[] = [];
export const dbSiteIcaReklambladOffers: IcaReklambladIngestedOffer[] = [];
export const dbSiteMathemProducts: MathemIngestedProduct[] = [];
export const dbSiteCompareStoreCapabilities: DbSiteCompareStoreCapability[] = [
  {
    "chainId": "city_gross",
    "coupon": false,
    "delivery": false,
    "pickup": false,
    "evidenceLabel": "no live retailer rows",
    "evidenceUpdatedAt": null
  },
  {
    "chainId": "ica",
    "coupon": true,
    "delivery": true,
    "pickup": true,
    "evidenceLabel": "5300 coupon/offer rows · 3477 online rows · 5289 store rows",
    "evidenceUpdatedAt": "2026-05-25T05:40:16.365Z"
  },
  {
    "chainId": "coop",
    "coupon": true,
    "delivery": true,
    "pickup": true,
    "evidenceLabel": "9500 product rows · 50 coupon/offer rows · 9500 online rows · 50 store rows",
    "evidenceUpdatedAt": "2026-05-24T17:15:21.069Z"
  },
  {
    "chainId": "willys",
    "coupon": true,
    "delivery": true,
    "pickup": true,
    "evidenceLabel": "11200 product rows · 46905 coupon/offer rows · 11200 online rows · 46905 store rows",
    "evidenceUpdatedAt": "2026-05-25T08:05:40.816Z"
  },
  {
    "chainId": "hemkop",
    "coupon": true,
    "delivery": true,
    "pickup": true,
    "evidenceLabel": "11802 product rows · 54842 coupon/offer rows · 11802 online rows · 54842 store rows",
    "evidenceUpdatedAt": "2026-05-25T08:05:40.816Z"
  },
  {
    "chainId": "lidl",
    "coupon": false,
    "delivery": false,
    "pickup": false,
    "evidenceLabel": "no live retailer rows",
    "evidenceUpdatedAt": null
  }
];

export const dbSiteMatpriskollenSource = {
  "source": "postgres.latest_prices/observations Matpriskollen-compatible fallback",
  "retrievedAt": null,
  "rowCount": 0
} as const;
export const dbSiteLidlSource = {
  "source": "postgres.latest_prices/observations Lidl-compatible fallback",
  "retrievedAt": null,
  "rowCount": 0
} as const;
export const dbSiteIcaReklambladSource = {
  "source": "postgres.latest_prices/observations ICA flyer-compatible fallback",
  "retrievedAt": null,
  "rowCount": 0
} as const;
export const dbSiteMathemSource = {
  "source": "postgres.latest_prices/observations Mathem-compatible fallback",
  "retrievedAt": null,
  "rowCount": 0
} as const;
