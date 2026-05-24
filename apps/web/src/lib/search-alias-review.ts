export type PendingSearchAlias = {
  id: string;
  query: string;
  normalizedQuery: string;
  suggestedAlias: string;
  targetProductSlug: string;
  targetProductName: string;
  evidenceLabel: string;
  createdAt: string;
};

export type SearchAliasDecision = 'approve' | 'reject';

export type SearchAliasDecisionRequest = {
  aliasId: string;
  decision: SearchAliasDecision;
  reviewerNote?: string;
};

export const pendingSearchAliasesEndpoint = '/api/admin/search-aliases/pending';
export const approvePendingSearchAliasEndpoint = '/api/admin/search-aliases/approve_pending_search_alias';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = response.status === 401
      ? 'Sign in first to review pending search aliases.'
      : `Search alias review request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function loadPendingSearchAliases(fetcher: typeof fetch = fetch): Promise<PendingSearchAlias[]> {
  const response = await fetcher(pendingSearchAliasesEndpoint, {
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const payload = await parseJsonResponse<{ aliases?: PendingSearchAlias[] } | PendingSearchAlias[]>(response);
  return Array.isArray(payload) ? payload : payload.aliases ?? [];
}

export async function postSearchAliasDecision(request: SearchAliasDecisionRequest, fetcher: typeof fetch = fetch) {
  const response = await fetcher(approvePendingSearchAliasEndpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'approve_pending_search_alias',
      aliasId: request.aliasId,
      decision: request.decision,
      reviewerNote: request.reviewerNote?.trim() || undefined
    })
  });
  return parseJsonResponse<{ ok: boolean; aliasId?: string }>(response);
}
