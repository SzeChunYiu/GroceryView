// Empty fallback for local builds without a DB-backed site snapshot export.
// Production deploys overwrite this module from postgres.latest_prices/observations before Next builds.
import type { ChainPriceObservation } from '@groceryview/core';

export type DbSiteChainPriceObservation = ChainPriceObservation & {
  originCountry?: string;
  certLevel?: string;
};

export const dbSiteChainObservationsGeneratedAt = null;
export const dbSiteSnapshotChainPriceObservations: DbSiteChainPriceObservation[] = [];
