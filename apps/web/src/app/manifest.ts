import type { MetadataRoute } from 'next';

type ExtendedManifest = MetadataRoute.Manifest & {
  display_override: string[];
  launch_handler: { client_mode: string };
  prefer_related_applications: boolean;
  screenshots: Array<{
    src: string;
    sizes: string;
    type: string;
    form_factor?: 'narrow' | 'wide';
    label?: string;
  }>;
};

export default function manifest(): ExtendedManifest {
  return {
    name: 'GroceryView verified grocery terminal',
    short_name: 'GroceryView',
    description: 'Install GroceryView for mobile-first Swedish grocery price checks with verified prices and source confidence.',
    id: '/',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#064e3b',
    categories: ['shopping', 'finance', 'food'],
    prefer_related_applications: false,
    launch_handler: {
      client_mode: 'navigate-existing'
    },
    icons: [
      {
        src: '/pwa-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/pwa-maskable-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ],
    screenshots: [
      {
        src: '/pwa-icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        form_factor: 'narrow',
        label: 'GroceryView verified price terminal'
      }
    ],
    shortcuts: [
      {
        name: 'Compare chain prices',
        short_name: 'Compare',
        description: 'Open the verified chain price comparison route.',
        url: '/compare?source=pwa-shortcut',
        icons: [{ src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      },
      {
        name: 'Browse verified stores',
        short_name: 'Stores',
        description: 'Open the verified Swedish grocery store directory.',
        url: '/stores?source=pwa-shortcut',
        icons: [{ src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      },
      {
        name: 'Weekly basket',
        short_name: 'Basket',
        description: 'Open basket workflows for repeat grocery planning.',
        url: '/compare?source=pwa-basket',
        icons: [{ src: '/pwa-maskable-icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      }
    ]
  };
}
