import { describe, expect, it } from 'vitest';
import {
  getBenchmarkCategories,
  getBenchmarksFor,
  linkBenchmarkToCommodity,
  officialBenchmarkCategories,
  officialBenchmarkRegistry
} from '../benchmarkRegistry.js';

describe('benchmark registry', () => {
  it('returns Swedish grocery benchmarks from official registry sources', () => {
    const ids = getBenchmarksFor('SE', 'grocery').map((source) => source.id);
    expect(ids).toContain('SCB_CPI');
    expect(ids).toContain('EUROSTAT_HICP');
    expect(ids).toContain('EU_AGRI_FOOD');
  });

  it('keeps every seed source registry-only and honest about its layer', () => {
    expect(officialBenchmarkRegistry).toHaveLength(8);
    expect(officialBenchmarkRegistry.map((source) => source.id)).toMatchInlineSnapshot(`
      [
        "EUROSTAT_HICP",
        "SCB_CPI",
        "SSB_CPI_03013",
        "STATICE_CPI",
        "STATICE_ENERGY",
        "TLV_MEDICINES",
        "NOMA_MEDICINES",
        "EU_AGRI_FOOD",
      ]
    `);
    expect(officialBenchmarkRegistry.every((source) => source.status === 'registry_only')).toBe(true);
    expect(officialBenchmarkRegistry.every((source) => source.notes.length > 80)).toBe(true);
    expect(officialBenchmarkRegistry.every((source) => source.homepageUrl && source.apiUrl)).toBe(true);
  });

  it('filters categories by vertical and links future commodity mappings immutably', () => {
    const eurostat = officialBenchmarkRegistry.find((source) => source.id === 'EUROSTAT_HICP');
    expect(eurostat).toBeDefined();
    const fuelCategories = getBenchmarkCategories(eurostat!, 'fuel');
    expect(fuelCategories.map((category) => category.code)).toEqual(['CP0722']);

    const linked = linkBenchmarkToCommodity(fuelCategories[0]!, 'fuel-diesel');
    expect(linked.groceryViewCommodityIds).toEqual(['fuel-diesel']);
    expect(fuelCategories[0]!.groceryViewCommodityIds).toBeUndefined();
  });

  it('snapshots the seeded category coverage by vertical', () => {
    expect(officialBenchmarkCategories.map(({ code, vertical }) => `${code}:${vertical}`)).toMatchInlineSnapshot(`
      [
        "CP01:grocery",
        "CP011:grocery",
        "CP0111:grocery",
        "CP0112:grocery",
        "CP01121:grocery",
        "CP01122:grocery",
        "CP01124:grocery",
        "CP0113:grocery",
        "CP0114:grocery",
        "CP0115:grocery",
        "CP0116:grocery",
        "CP0117:grocery",
        "CP01174:grocery",
        "CP0121:grocery",
        "CP06:pharmacy",
        "CP061:pharmacy",
        "CP0611:pharmacy",
        "CP0612:pharmacy",
        "CP0613:pharmacy",
        "CP0722:fuel",
      ]
    `);
  });
});
