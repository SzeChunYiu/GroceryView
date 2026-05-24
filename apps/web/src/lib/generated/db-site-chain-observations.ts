// Empty fallback for local builds without a DB-backed site snapshot export.
// Production deploys overwrite this module from postgres.latest_prices/observations before Next builds.
// Rows may include source-level originCountry and certLevel evidence when exported from observations.
import type { ChainPriceObservation } from '@groceryview/core';

export const dbSiteChainObservationsGeneratedAt = null;
export const dbSiteSnapshotChainPriceObservations: ChainPriceObservation[] = [];
