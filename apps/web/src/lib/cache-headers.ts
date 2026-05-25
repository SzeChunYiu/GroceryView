type EdgeCacheProfile = 'product-search' | 'suggest';

const edgeCacheProfiles: Record<EdgeCacheProfile, { maxAge: number; swr: number }> = {
  'product-search': { maxAge: 45, swr: 120 },
  suggest: { maxAge: 60, swr: 120 }
};

export function readOnlyEdgeCacheHeaders(profile: EdgeCacheProfile) {
  const { maxAge, swr } = edgeCacheProfiles[profile];
  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
    Vary: 'Accept-Encoding'
  };
}
