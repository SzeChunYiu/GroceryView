import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-market-oat/50', className)}
      {...props}
    />
  );
}
