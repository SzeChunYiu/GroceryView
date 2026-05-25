import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GroceryView verified grocery terminal',
    short_name: 'GroceryView',
    description: 'Install GroceryView to your home screen for mobile-first Swedish grocery price checks, saved lists, cached product details, and offline store trips.',
    id: '/',
    start_url: '/?utm_source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#064e3b',
    categories: ['shopping', 'finance', 'food'],
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
    shortcuts: [
      {
        name: 'Compare chain prices',
        short_name: 'Compare',
        description: 'Open the verified chain price comparison route.',
        url: '/compare',
        icons: [{ src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      },
      {
        name: 'Open shopping list',
        short_name: 'List',
        description: 'Open the cached shopping list, favourites, and saved product price routes for offline store aisles.',
        url: '/list',
        icons: [{ src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      },
      {
        name: 'Open saved favourites',
        short_name: 'Favourites',
        description: 'Open locally saved favourite products with cached price cards for offline checks.',
        url: '/favourites',
        icons: [{ src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      },
      {
        name: 'Browse verified stores',
        short_name: 'Stores',
        description: 'Open the verified Swedish grocery store directory.',
        url: '/stores',
        icons: [{ src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml' }]
      }
    ]
  };
}
