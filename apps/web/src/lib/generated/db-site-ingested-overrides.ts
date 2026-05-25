// AUTO-GENERATED from live retailer ingestion by scripts/ingestion/generate-live-retailer-ingested.mjs.
// Generated at: 2026-05-25T05:37:53.937Z
// Compare store capability row count: 4
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

export const dbSiteIngestedOverridesGeneratedAt = "2026-05-25T05:37:53.937Z";

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
    "chainId": "willys",
    "coupon": true,
    "delivery": true,
    "pickup": true,
    "evidenceLabel": "11278 product rows · 46905 coupon/offer rows · 11278 online rows · 46905 store rows",
    "evidenceUpdatedAt": "2026-05-25T05:37:53.937Z"
  },
  {
    "chainId": "hemkop",
    "coupon": true,
    "delivery": true,
    "pickup": true,
    "evidenceLabel": "11802 product rows · 55034 coupon/offer rows · 11802 online rows · 55034 store rows",
    "evidenceUpdatedAt": "2026-05-25T05:37:53.937Z"
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
