'use client';

import { useCallback, useEffect, useState } from 'react';
import { readLocalStorageStringArray, writeLocalStorageStringArray } from '@/lib/localStorage';

export const SEARCH_HISTORY_STORAGE_KEY = 'groceryview:search-history:v1';
export const SEARCH_HISTORY_LIMIT = 10;

function normalizeSearchQuery(query: string) {
  return query.trim().replace(/\s+/g, ' ');
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(readLocalStorageStringArray(SEARCH_HISTORY_STORAGE_KEY, SEARCH_HISTORY_LIMIT));
  }, []);

  const addSearchQuery = useCallback((query: string) => {
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) return;

    setHistory((currentHistory) => {
      const nextHistory = [
        normalizedQuery,
        ...currentHistory.filter((item) => item.toLocaleLowerCase('sv-SE') !== normalizedQuery.toLocaleLowerCase('sv-SE'))
      ].slice(0, SEARCH_HISTORY_LIMIT);
      writeLocalStorageStringArray(SEARCH_HISTORY_STORAGE_KEY, nextHistory);
      return nextHistory;
    });
  }, []);

  return { addSearchQuery, history };
}
