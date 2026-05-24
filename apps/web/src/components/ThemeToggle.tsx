'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const storageKey = 'groceryview:theme';

function preferredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(storageKey);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const next = preferredTheme();
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    window.localStorage.setItem(storageKey, next);
    document.documentElement.dataset.theme = next;
  }

  return (
    <button aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="fixed right-4 top-4 z-50 rounded-full border border-slate-300 bg-white/90 p-3 text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" onClick={toggleTheme} type="button">
      {theme === 'dark' ? <Sun aria-hidden="true" className="h-5 w-5" /> : <Moon aria-hidden="true" className="h-5 w-5" />}
    </button>
  );
}
