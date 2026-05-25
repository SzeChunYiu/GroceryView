#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import process from 'node:process';
import {
  buildIcelandCoverageReadinessReport,
  emptyIcelandCoverageReadinessInput,
  icelandCoverageThresholds
} from '../../packages/ops/dist/index.js';

function readJsonValueFromEnv(name) {
  const raw = process.env[name];
  if (raw?.trim()) return raw;
  const filePath = process.env[`${name}_FILE`];
  if (filePath?.trim()) return readFileSync(filePath.trim(), 'utf8');
  return '';
}

function previewInput() {
  return {
    chains: ['bonus', 'kronan', 'netto', 'hagkaup'],
    cities: ['Reykjavik'],
    nationalRegions: [],
    storeCount: 0,
    reykjavikStoreCount: 0,
    productCount: 0,
    stapleProductCount: 0,
    categories: ['dairy', 'bread', 'produce', 'meat-fish', 'pantry', 'hygiene'],
    sources: [{ sourceId: 'iceland-starter-basket-taxonomy', sourceType: 'manual_taxonomy' }],
    starterBasketItemCount: icelandCoverageThresholds.preview.stapleProducts
  };
}

function reykjavikInput() {
  return {
    chains: ['bonus', 'kronan', 'netto'],
    cities: ['Reykjavik'],
    nationalRegions: ['capital-region'],
    storeCount: icelandCoverageThresholds.reykjavik.stores,
    reykjavikStoreCount: icelandCoverageThresholds.reykjavik.reykjavikStores,
    productCount: icelandCoverageThresholds.reykjavik.products,
    stapleProductCount: icelandCoverageThresholds.reykjavik.stapleProducts,
    categories: Array.from({ length: icelandCoverageThresholds.reykjavik.categories }, (_, index) => `reykjavik-category-${index}`),
    sources: [
      {
        sourceId: 'bonus-is-public-storefront',
        sourceType: 'public_storefront',
        latestObservedAt: '2026-05-21T00:00:00.000Z',
        livePriceObservationCount: 300
      },
      {
        sourceId: 'kronan-is-flyer',
        sourceType: 'flyer_campaign',
        latestObservedAt: '2026-05-22T00:00:00.000Z',
        livePriceObservationCount: 250
      }
    ],
    latestObservedAt: '2026-05-22T00:00:00.000Z',
    starterBasketItemCount: icelandCoverageThresholds.preview.stapleProducts
  };
}

function productionInput() {
  return {
    chains: ['bonus', 'kronan', 'netto', 'hagkaup'],
    cities: ['Reykjavik', 'Kopavogur', 'Akureyri', 'Reykjanesbaer', 'Selfoss'],
    nationalRegions: ['capital-region', 'south', 'north', 'west', 'reykjanes'],
    storeCount: icelandCoverageThresholds.production.stores,
    reykjavikStoreCount: icelandCoverageThresholds.production.reykjavikStores,
    productCount: icelandCoverageThresholds.production.products,
    stapleProductCount: icelandCoverageThresholds.production.stapleProducts,
    categories: Array.from({ length: icelandCoverageThresholds.production.categories }, (_, index) => `production-category-${index}`),
    sources: [
      {
        sourceId: 'bonus-is-public-storefront',
        sourceType: 'public_storefront',
        latestObservedAt: '2026-05-22T00:00:00.000Z',
        livePriceObservationCount: 700
      },
      {
        sourceId: 'kronan-is-flyer',
        sourceType: 'flyer_campaign',
        latestObservedAt: '2026-05-22T12:00:00.000Z',
        livePriceObservationCount: 500
      },
      {
        sourceId: 'hagkaup-is-public-storefront',
        sourceType: 'public_storefront',
        latestObservedAt: '2026-05-22T18:00:00.000Z',
        livePriceObservationCount: 350
      }
    ],
    latestObservedAt: '2026-05-22T18:00:00.000Z',
    starterBasketItemCount: icelandCoverageThresholds.preview.stapleProducts
  };
}

function inputFromEnvironment() {
  if (process.argv.includes('--self-test-preview')) return previewInput();
  if (process.argv.includes('--self-test-reykjavik')) return reykjavikInput();
  if (process.argv.includes('--self-test-production')) return productionInput();

  const raw = readJsonValueFromEnv('ICELAND_COVERAGE_JSON');
  return raw.trim() ? JSON.parse(raw) : emptyIcelandCoverageReadinessInput;
}

const asOf = process.env.ICELAND_COVERAGE_AS_OF?.trim() || new Date().toISOString();
const report = buildIcelandCoverageReadinessReport(inputFromEnvironment(), { asOf });
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
