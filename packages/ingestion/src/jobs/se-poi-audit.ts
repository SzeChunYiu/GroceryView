import { PrismaClient } from '@prisma/client';
import { fetchOverpassPoiAudit, type OverpassPoiAudit } from '../connectors/overpass';

type StoreOsmLink = {
  osmType: string | null;
  osmId: string | number | null;
  chainId: string | null;
};

type UnlinkedPoi = OverpassPoiAudit & {
  reason: 'missing-from-stores' | 'missing-chain-link';
};

type SePoiAuditReport = {
  generatedAt: string;
  totalOsmPois: number;
  totalUnlinkedPois: number;
  unlinkedSupermarkets: number;
  summaryByCategory: Record<string, number>;
  unlinkedPois: UnlinkedPoi[];
};

const prisma = new PrismaClient();

function osmKey(osmType: string, osmId: string | number): string {
  return `${osmType}:${osmId}`;
}

function summarizeByCategory(pois: UnlinkedPoi[]): Record<string, number> {
  return pois.reduce<Record<string, number>>((summary, poi) => {
    summary[poi.category] = (summary[poi.category] ?? 0) + 1;
    return summary;
  }, {});
}

async function loadStoreOsmLinks(): Promise<StoreOsmLink[]> {
  return prisma.$queryRaw<StoreOsmLink[]>`
    SELECT
      osm_type AS "osmType",
      osm_id AS "osmId",
      chain_id AS "chainId"
    FROM stores
    WHERE osm_id IS NOT NULL
  `;
}

export async function runSePoiAudit(): Promise<SePoiAuditReport> {
  const generatedAt = new Date().toISOString();
  const [pois, storeLinks] = await Promise.all([
    fetchOverpassPoiAudit({ retrievedAt: generatedAt }),
    loadStoreOsmLinks()
  ]);

  const knownStoreKeys = new Set<string>();
  const linkedStoreKeys = new Set<string>();

  for (const link of storeLinks) {
    if (!link.osmType || link.osmId === null) continue;
    const key = osmKey(link.osmType, link.osmId);
    knownStoreKeys.add(key);
    if (link.chainId) linkedStoreKeys.add(key);
  }

  const unlinkedPois = pois
    .filter((poi) => !linkedStoreKeys.has(osmKey(poi.osmType, poi.osmId)))
    .map((poi): UnlinkedPoi => ({
      ...poi,
      reason: knownStoreKeys.has(osmKey(poi.osmType, poi.osmId)) ? 'missing-chain-link' : 'missing-from-stores'
    }));

  return {
    generatedAt,
    totalOsmPois: pois.length,
    totalUnlinkedPois: unlinkedPois.length,
    unlinkedSupermarkets: unlinkedPois.filter((poi) => poi.category === 'supermarket').length,
    summaryByCategory: summarizeByCategory(unlinkedPois),
    unlinkedPois
  };
}

async function main(): Promise<void> {
  try {
    const report = await runSePoiAudit();
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
