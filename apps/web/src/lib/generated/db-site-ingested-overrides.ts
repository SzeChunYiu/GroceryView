// Empty fallback for local builds without a DB-backed site snapshot export.
// Production deploys overwrite this module from postgres.latest_prices/observations before Next builds.
import type { IcaReklambladIngestedOffer } from '../ingested/ica-reklamblad';
import type { LidlIngestedStoreOffer } from '../ingested/lidl';
import type { MathemIngestedProduct } from '../ingested/mathem';
import type { MatpriskollenIngestedOffer } from '../ingested/matpriskollen';

export const dbSiteIngestedOverridesGeneratedAt = null;


export type DbSiteCompareStoreCapability = {
  chainId: string;
  chainName: string;
  canCompare: boolean;
  evidenceUpdatedAt: string | null;
  generatedAt: string | null;
  rowCount: number;
  source: string;
};

export const dbSiteCompareStoreCapabilities: DbSiteCompareStoreCapability[] = [];

export const dbSiteMatpriskollenOffers: MatpriskollenIngestedOffer[] = [];
export const dbSiteLidlStoreOffers: LidlIngestedStoreOffer[] = [];
export const dbSiteIcaReklambladOffers: IcaReklambladIngestedOffer[] = [];
export const dbSiteMathemProducts: MathemIngestedProduct[] = [];

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
