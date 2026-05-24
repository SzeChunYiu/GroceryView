'use client';

import type { ReactNode } from 'react';
import { AppNav } from './app-nav';
import { BottomNav } from './bottom-nav';

export function PageShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
      <BottomNav />
    </div>
  );
}

export function Eyebrow({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">{children}</p>;
}

export function Card({ children, className = '' }: Readonly<{ children: ReactNode; className?: string }>) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white/88 p-5 shadow-sm ${className}`}>{children}</section>;
}
