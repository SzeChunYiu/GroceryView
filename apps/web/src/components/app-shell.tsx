'use client';

import type { ReactNode } from 'react';
import { AppNav } from './app-nav';

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <AppNav />
      {children}
    </>
  );
}
