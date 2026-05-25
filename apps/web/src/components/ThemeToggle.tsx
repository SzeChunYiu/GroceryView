'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type ThemePreference = 'light' | 'dark';

type ThemeToggleProps = {
  darkLabel: string;
  lightLabel: string;
  switchToDarkLabel: string;
  switchToLightLabel: string;
};

const themePreferenceStorageKey = 'groceryview:theme-preference';

function applyThemePreference(preference: ThemePreference) {
  document.documentElement.classList.toggle('dark', preference === 'dark');
  document.documentElement.style.colorScheme = preference;
}

function preferredTheme(): ThemePreference {
  const storedPreference = window.localStorage.getItem(themePreferenceStorageKey);
  if (storedPreference === 'dark' || storedPreference === 'light') return storedPreference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle({ darkLabel, lightLabel, switchToDarkLabel, switchToLightLabel }: ThemeToggleProps) {
  const [themePreference, setThemePreference] = useState<ThemePreference>('light');

  useEffect(() => {
    const initialPreference = preferredTheme();
    setThemePreference(initialPreference);
    applyThemePreference(initialPreference);

    function handleSystemThemeChanged(event: MediaQueryListEvent) {
      if (window.localStorage.getItem(themePreferenceStorageKey)) return;
      const nextPreference = event.matches ? 'dark' : 'light';
      setThemePreference(nextPreference);
      applyThemePreference(nextPreference);
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChanged);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChanged);
  }, []);

  function toggleThemePreference() {
    const nextPreference = themePreference === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(themePreferenceStorageKey, nextPreference);
    setThemePreference(nextPreference);
    applyThemePreference(nextPreference);
  }

  return (
    <button
      aria-label={themePreference === 'dark' ? switchToLightLabel : switchToDarkLabel}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-700 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-200"
      onClick={toggleThemePreference}
      type="button"
    >
      {themePreference === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      <span>{themePreference === 'dark' ? lightLabel : darkLabel}</span>
    </button>
  );
}
