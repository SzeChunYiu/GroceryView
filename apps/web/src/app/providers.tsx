'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const themeStorageKey = 'groceryview:theme';

const ThemeContext = createContext<{
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
} | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [hasLoadedTheme, setHasLoadedTheme] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    setTheme(isThemePreference(storedTheme) ? storedTheme : 'system');
    setHasLoadedTheme(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedTheme) return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function syncTheme(nextTheme: ThemePreference = theme) {
      const nextResolvedTheme = nextTheme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : nextTheme;
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextResolvedTheme);
    }

    window.localStorage.setItem(themeStorageKey, theme);
    syncTheme();

    if (theme !== 'system') return undefined;

    const handleSystemThemeChange = () => syncTheme('system');
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [hasLoadedTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme: () => setTheme((currentTheme) => (currentTheme === 'dark' || (currentTheme === 'system' && getSystemTheme() === 'dark') ? 'light' : 'dark'))
    }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within Providers');
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
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
