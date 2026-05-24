'use client';

import type { ReactNode } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

type PullRefreshWrapperProps = {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  refreshLabel?: string;
};

const statusText = {
  complete: 'Latest prices refreshed.',
  error: 'Could not refresh prices. Try again.',
  idle: 'Pull down to refresh latest prices.',
  pulling: 'Keep pulling to refresh prices.',
  ready: 'Release to refresh latest prices.',
  refreshing: 'Refreshing latest prices…'
};

export function PullRefreshWrapper({ children, onRefresh, refreshLabel = 'Pull to refresh latest prices' }: Readonly<PullRefreshWrapperProps>) {
  const { handlers, isRefreshing, pullDistance, refresh, status } = usePullToRefresh({ onRefresh });
  const visible = status !== 'idle' || pullDistance > 0;

  return (
    <div className="relative overscroll-y-contain" {...handlers}>
      <div
        aria-live="polite"
        className={`sticky top-0 z-30 mx-auto flex w-full max-w-xs justify-center transition-all md:hidden ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        style={{ height: visible ? Math.max(44, pullDistance) : 0 }}
      >
        <div className="mt-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-900 shadow-sm">
          {statusText[status]}
        </div>
      </div>
      <button
        className="sr-only"
        disabled={isRefreshing}
        onClick={() => void refresh()}
        type="button"
      >
        {refreshLabel}
      </button>
      {children}
    </div>
  );
}
