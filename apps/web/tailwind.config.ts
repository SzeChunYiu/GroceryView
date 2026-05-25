import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        market: {
          ink: 'var(--gv-color-ink)',
          paper: 'var(--gv-color-canvas)',
          surface: 'var(--gv-color-surface)',
          raised: 'var(--gv-color-surface-raised)',
          terminal: 'var(--gv-color-terminal)',
          grid: 'var(--gv-color-grid)',
          mint: 'var(--gv-color-accent)',
          buy: 'var(--gv-color-buy)',
          sell: 'var(--gv-color-sell)',
          wait: 'var(--gv-color-wait)'
        }
      },
      borderRadius: {
        control: 'var(--gv-radius-control)',
        panel: 'var(--gv-radius-panel)',
        sheet: 'var(--gv-radius-sheet)'
      },
      fontFamily: {
        sans: 'var(--gv-font-sans)',
        mono: 'var(--gv-font-mono)'
      }
    }
  },
  plugins: []
};

export default config;
