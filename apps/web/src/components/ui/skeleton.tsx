import type { HTMLAttributes } from 'react';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className ?? ''}`} {...props} />;
}

export function SearchSuggestionSkeleton() {
  return (
    <div className="px-4 py-3" aria-hidden="true">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}
