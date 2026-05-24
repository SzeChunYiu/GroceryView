// Empty fallback for local builds without a DB-backed site snapshot export.
// Production deploys overwrite this module from postgres.latest_prices/observations before Next builds.
import type { IcaReklambladIngestedOffer } from '../ingested/ica-reklamblad';
import type { LidlIngestedStoreOffer } from '../ingested/lidl';
import type { MathemIngestedProduct } from '../ingested/mathem';
import type { MatpriskollenIngestedOffer } from '../ingested/matpriskollen';

export const dbSiteIngestedOverridesGeneratedAt = null;

export const dbSiteMatpriskollenOffers: MatpriskollenIngestedOffer[] = [];
export const dbSiteLidlStoreOffers: LidlIngestedStoreOffer[] = [];
export const dbSiteIcaReklambladOffers: IcaReklambladIngestedOffer[] = [];
export const dbSiteMathemProducts: MathemIngestedProduct[] = [];

export type DbSiteCompareStoreCapability = {
  chainId: 'ica' | 'willys' | 'coop';
  label: string;
  coupons: boolean;
  delivery: boolean;
  pickup: boolean;
  evidenceLabel: string;
  evidenceUpdatedAt: string | null;
};

export const dbSiteCompareStoreCapabilities: DbSiteCompareStoreCapability[] = [
  {
    chainId: 'ica',
    label: 'ICA',
    coupons: true,
    delivery: true,
    pickup: true,
    evidenceLabel: 'ICA store-scoped promotions and checkout capability evidence',
    evidenceUpdatedAt: null
  },
  {
    chainId: 'willys',
    label: 'Willys',
    coupons: true,
    delivery: true,
    pickup: true,
    evidenceLabel: 'Willys online catalogue, coupon, delivery, and pickup capability evidence',
    evidenceUpdatedAt: null
  },
  {
    chainId: 'coop',
    label: 'Coop',
    coupons: false,
    delivery: true,
    pickup: false,
    evidenceLabel: 'Coop delivery capability evidence; coupon and pickup rows not verified in this snapshot',
    evidenceUpdatedAt: null
  }
];

export const dbSiteMatpriskollenSource = {
  source: 'postgres.latest_prices/observations Matpriskollen-compatible fallback',
  retrievedAt: null,
  rowCount: 0
} as const;

export const dbSiteLidlSource = {
  source: 'postgres.latest_prices/observations Lidl-compatible fallback',
  retrievedAt: null,
  rowCount: 0
} as const;

export const dbSiteIcaReklambladSource = {
  source: 'postgres.latest_prices/observations ICA flyer-compatible fallback',
  retrievedAt: null,
  rowCount: 0
} as const;

export const dbSiteMathemSource = {
  source: 'postgres.latest_prices/observations Mathem-compatible fallback',
  retrievedAt: null,
  rowCount: 0
} as const;
