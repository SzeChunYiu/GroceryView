import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        market: {
          ink: '#101617',
          paper: '#f7f4ec',
          mint: '#18a77b',
          tomato: '#d94f3d',
          oat: '#eadfc7'
        }
      }
    }
  },
  plugins: []
};

export default config;
