// Empty fallback for local builds without a DB-backed compare-store capability export.
// Production deploys overwrite this module from postgres.latest_prices/observations before Next builds.

export type DbSiteCompareStoreCapability = {
  chainId: string;
  chainName?: string;
  label?: string;
  canCompare?: boolean;
  evidenceUpdatedAt?: string | null;
  capabilitySource?: string;
  source?: string;
};

export const dbSiteCompareStoreCapabilitiesGeneratedAt: string | null = null;
export const dbSiteCompareStoreCapabilities: DbSiteCompareStoreCapability[] = [];
