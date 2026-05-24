'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const themeStorageKey = 'groceryview:theme';

const ThemeContext = createContext<{
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
} | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(themeStorageKey);
    const nextPreference = isThemePreference(storedPreference) ? storedPreference : 'system';
    const nextResolvedTheme = nextPreference === 'system' ? getSystemTheme() : nextPreference;
    setPreferenceState(nextPreference);
    setResolvedTheme(nextResolvedTheme);
    applyTheme(nextResolvedTheme);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function handleSystemThemeChanged() {
      if (preference !== 'system') return;
      const nextResolvedTheme = getSystemTheme();
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextResolvedTheme);
    }

    handleSystemThemeChanged();
    mediaQuery.addEventListener('change', handleSystemThemeChanged);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChanged);
  }, [preference]);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference(nextPreference: ThemePreference) {
        window.localStorage.setItem(themeStorageKey, nextPreference);
        const nextResolvedTheme = nextPreference === 'system' ? getSystemTheme() : nextPreference;
        setPreferenceState(nextPreference);
        setResolvedTheme(nextResolvedTheme);
        applyTheme(nextResolvedTheme);
      }
    }),
    [preference, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
