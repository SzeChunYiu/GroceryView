export type MarketTerminalMode = 'light' | 'dark';
export type ChainTokenKey = 'ica' | 'willys' | 'hemkop' | 'coop' | 'mathem' | 'meny' | 'rema1000' | 'fallback';
export type CountryTokenKey = 'se' | 'no' | 'dk' | 'fi' | 'is';

export const marketTerminalTokens = {
  direction: {
    name: 'market-terminal-grocery',
    summary: 'Dense market terminal controls with fresh grocery state colors, compact data cards, and source confidence emphasis.'
  },
  color: {
    light: {
      canvas: '#f3f6ef',
      surface: '#ffffff',
      surfaceRaised: '#f8faf4',
      terminal: '#101817',
      terminalSoft: '#172322',
      ink: '#101617',
      muted: '#52605d',
      border: '#cbd8cf',
      grid: 'rgba(16, 24, 23, 0.08)',
      accent: '#12805f',
      accentStrong: '#0b5f47',
      buy: '#0f7a55',
      sell: '#c2412f',
      wait: '#b7791f',
      info: '#1d6d8f'
    },
    dark: {
      canvas: '#07110f',
      surface: '#101817',
      surfaceRaised: '#172322',
      terminal: '#050807',
      terminalSoft: '#0d1715',
      ink: '#ecfdf5',
      muted: '#9fb2ad',
      border: '#2c403a',
      grid: 'rgba(159, 178, 173, 0.14)',
      accent: '#39d39f',
      accentStrong: '#7df0c2',
      buy: '#58d89e',
      sell: '#ff806d',
      wait: '#f4c15d',
      info: '#72c7e8'
    }
  },
  typography: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
    displayTracking: '0',
    dataTracking: '0.02em'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    panel: '1.25rem',
    section: '2rem'
  },
  radius: {
    control: '0.5rem',
    panel: '0.75rem',
    sheet: '1rem',
    chart: '0.75rem'
  },
  chart: {
    axisText: '#334155',
    gridLine: 'rgba(80, 100, 94, 0.18)',
    crosshair: '#12805f',
    forecast: '#b7791f',
    forecastBand: 'rgba(183, 121, 31, 0.38)',
    series: ['#0f7a55', '#1d6d8f', '#b7791f', '#c2412f', '#5361d6'],
    band: ['rgba(15, 122, 85, 0.34)', 'rgba(29, 109, 143, 0.32)', 'rgba(183, 121, 31, 0.3)', 'rgba(194, 65, 47, 0.3)', 'rgba(83, 97, 214, 0.28)']
  },
  state: {
    confidence: {
      high: { foreground: '#064e3b', background: '#dcfce7', border: '#86efac', indicator: 'HIGH' },
      medium: { foreground: '#075985', background: '#e0f2fe', border: '#7dd3fc', indicator: 'MED' },
      low: { foreground: '#78350f', background: '#fef3c7', border: '#fcd34d', indicator: 'LOW' }
    },
    freshness: {
      fresh: { foreground: '#065f46', background: '#d1fae5', border: '#6ee7b7', indicator: 'LIVE' },
      aging: { foreground: '#7c2d12', background: '#ffedd5', border: '#fdba74', indicator: 'AGING' },
      stale: { foreground: '#7f1d1d', background: '#fee2e2', border: '#fca5a5', indicator: 'STALE' }
    },
    chart: {
      rising: { color: '#c2412f', indicator: 'ASK' },
      falling: { color: '#0f7a55', indicator: 'BID' },
      flat: { color: '#52605d', indicator: 'MID' },
      forecast: { color: '#b7791f', indicator: 'FWD' }
    }
  },
  chains: {
    ica: { label: 'ICA', color: '#e1242a', contrast: '#ffffff' },
    willys: { label: 'Willys', color: '#cf102d', contrast: '#ffffff' },
    hemkop: { label: 'Hemkop', color: '#196c40', contrast: '#ffffff' },
    coop: { label: 'Coop', color: '#00a651', contrast: '#06110b' },
    mathem: { label: 'Mathem', color: '#6f3cc3', contrast: '#ffffff' },
    meny: { label: 'Meny', color: '#d71920', contrast: '#ffffff' },
    rema1000: { label: 'REMA 1000', color: '#174ea6', contrast: '#ffffff' },
    fallback: { label: 'Chain', color: '#52605d', contrast: '#ffffff' }
  },
  countries: {
    se: { label: 'Sweden', code: 'SE', flagToken: 'SE', currency: 'SEK' },
    no: { label: 'Norway', code: 'NO', flagToken: 'NO', currency: 'NOK' },
    dk: { label: 'Denmark', code: 'DK', flagToken: 'DK', currency: 'DKK' },
    fi: { label: 'Finland', code: 'FI', flagToken: 'FI', currency: 'EUR' },
    is: { label: 'Iceland', code: 'IS', flagToken: 'IS', currency: 'ISK' }
  }
} as const;

export const marketTerminalChartTokens = marketTerminalTokens.chart;

export function marketTerminalModeTokens(mode: MarketTerminalMode) {
  return marketTerminalTokens.color[mode];
}

export function chainTokenForSlug(slug: string | null | undefined) {
  const normalized = (slug ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') as ChainTokenKey;
  return marketTerminalTokens.chains[normalized] ?? marketTerminalTokens.chains.fallback;
}

export function countryTokenForCode(code: string | null | undefined) {
  const normalized = (code ?? '').toLowerCase() as CountryTokenKey;
  return marketTerminalTokens.countries[normalized] ?? marketTerminalTokens.countries.se;
}
