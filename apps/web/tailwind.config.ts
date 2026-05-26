import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy palette remapped onto the v3 editorial-terminal tokens
        // (defined in design-system.css) so existing `market-*` usages shift.
        market: {
          ink: 'var(--ink)',
          paper: 'var(--bg)',
          mint: 'var(--up)',
          tomato: 'var(--down)',
          oat: 'var(--bg-2)'
        },
        // Semantic v3 tokens for converted components
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        brand: 'var(--brand)',
        'brand-deep': 'var(--brand-deep)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        rule: 'var(--rule)',
        up: 'var(--up)',
        down: 'var(--down)',
        warn: 'var(--warn)',
        info: 'var(--info)'
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
