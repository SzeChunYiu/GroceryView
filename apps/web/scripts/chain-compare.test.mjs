import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const root = new URL('../', import.meta.url);

async function loadChainCompare({
  dbSiteSnapshotGeneratedAt = null,
  dbSiteCompareStoreCapabilities = [],
  dbSiteCompareStoreCapabilitiesGeneratedAt = null,
  commodityComparisonForProduct = () => null
} = {}) {
  const sourceUrl = new URL('src/lib/chain-compare.ts', root);
  const source = await readFile(sourceUrl, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    },
    fileName: sourceUrl.pathname
  });

  const module = { exports: {} };
  const sandbox = {
    exports: module.exports,
    module,
    require(specifier) {
      if (specifier === './axfood-products') return { axfoodProducts: [] };
      if (specifier === './generated/db-site-products') return { dbSiteSnapshotGeneratedAt };
      if (specifier === './verified-data') return { commodityComparisonForProduct };
      if (specifier === './generated/db-site-compare-store-capabilities') {
        return {
          dbSiteCompareStoreCapabilities,
          dbSiteCompareStoreCapabilitiesGeneratedAt
        };
      }
      throw new Error(`Unexpected chain-compare dependency in test: ${specifier}`);
    }
  };

  vm.runInNewContext(outputText, sandbox, { filename: sourceUrl.pathname });
  return module.exports;
}

const sampleProduct = {
  code: 'SAMPLE_ST',
  slug: 'sample-product',
  name: 'Sample product',
  brand: 'Sample Brand',
  subline: '1 st',
  category: 'test',
  image: null,
  labels: [],
  chains: {},
  lowestChain: '',
  lowestPrice: 0,
  highestPrice: 0,
  spreadPct: 0,
  inChains: []
};

describe('buildChainComparisonTable noChainState', () => {
  it('uses fallback compare capabilities and preserves missing-id guardrails', async () => {
    const { buildChainComparisonTable } = await loadChainCompare();

    const table = buildChainComparisonTable(' missing-id , Sample-Product , missing-id ', [sampleProduct]);

    assert.deepEqual(table.requestedIds, ['missing-id', 'sample-product']);
    assert.deepEqual(table.missingProductIds, ['missing-id']);
    assert.deepEqual(table.noChainState.activeFilters, ['product=missing-id', 'product=sample-product']);
    assert.deepEqual(table.noChainState.missingProductIds, ['missing-id']);
    assert.equal(table.noChainState.guardrail, 'The compare route does not infer products from names.');
    assert.equal(table.noChainState.capabilitySource, 'local fallback compare store capabilities');
    assert.equal(table.noChainState.evidenceUpdatedAt, null);
    assert.deepEqual(table.noChainState.storeCapabilities.map((capability) => capability.chainId), ['ica', 'willys', 'coop']);
  });

  it('uses injected generated dbSiteCompareStoreCapabilities for source and evidence timestamps', async () => {
    const capabilitySource = 'postgres.latest_prices/observations compare store capability snapshot';
    const { buildChainComparisonTable } = await loadChainCompare({
      dbSiteCompareStoreCapabilitiesGeneratedAt: '2026-05-24T00:00:00.000Z',
      dbSiteCompareStoreCapabilities: [
        {
          chainId: 'coop',
          chainName: 'Coop',
          canCompare: true,
          evidenceUpdatedAt: '2026-05-22T08:00:00.000Z',
          capabilitySource
        },
        {
          chainId: 'external-market',
          chainName: 'External Market',
          canCompare: true,
          evidenceUpdatedAt: '2026-05-24T10:00:00.000Z',
          capabilitySource
        },
        {
          chainId: 'willys',
          chainName: 'Willys',
          canCompare: false,
          evidenceUpdatedAt: '2026-05-23T09:00:00.000Z',
          capabilitySource
        }
      ]
    });

    const table = buildChainComparisonTable(null, []);

    assert.deepEqual(table.noChainState.activeFilters, []);
    assert.equal(table.noChainState.capabilitySource, capabilitySource);
    assert.equal(table.noChainState.evidenceUpdatedAt, '2026-05-23T09:00:00.000Z');
    assert.deepEqual(
      table.noChainState.storeCapabilities.map((capability) => ({
        chainId: capability.chainId,
        canCompare: capability.canCompare
      })),
      [
        { chainId: 'willys', canCompare: false },
        { chainId: 'coop', canCompare: true }
      ]
    );
  });
});
