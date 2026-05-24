#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import process from 'node:process';
import {
  buildNorwayCoverageReadinessReport,
  emptyNorwayCoverageReadinessInput,
  norwayCoverageThresholds
} from '../../packages/ops/dist/index.js';

function readJsonValueFromEnv(name) {
  const raw = process.env[name];
  if (raw?.trim()) return raw;
  const filePath = process.env[`${name}_FILE`];
  if (filePath?.trim()) return readFileSync(filePath.trim(), 'utf8');
  return '';
}

function demoInput() {
  return {
    chains: ['kiwi', 'rema-1000'],
    cities: ['Oslo', 'Bergen'],
    storeCount: norwayCoverageThresholds.demo.stores,
    productCount: norwayCoverageThresholds.demo.products,
    categories: Array.from({ length: norwayCoverageThresholds.demo.categories }, (_, index) => `demo-category-${index}`),
    sourceIds: ['kassalapp'],
    latestObservedAt: '2026-05-20T00:00:00.000Z'
  };
}

function productionInput() {
  return {
    chains: ['kiwi', 'rema-1000', 'meny', 'coop-no'],
    cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromsø'],
    storeCount: norwayCoverageThresholds.production.stores,
    productCount: norwayCoverageThresholds.production.products,
    categories: Array.from({ length: norwayCoverageThresholds.production.categories }, (_, index) => `production-category-${index}`),
    sourceIds: ['kassalapp', 'mattilbud'],
    latestObservedAt: '2026-05-22T00:00:00.000Z'
  };
}

function inputFromEnvironment() {
  if (process.argv.includes('--self-test-demo')) return demoInput();
  if (process.argv.includes('--self-test-production')) return productionInput();

  const raw = readJsonValueFromEnv('NORWAY_COVERAGE_JSON');
  return raw.trim() ? JSON.parse(raw) : emptyNorwayCoverageReadinessInput;
}

const asOf = process.env.NORWAY_COVERAGE_AS_OF?.trim() || new Date().toISOString();
const report = buildNorwayCoverageReadinessReport(inputFromEnvironment(), { asOf });
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
