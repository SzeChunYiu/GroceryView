import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n-request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: false,
    // Vercel Hobby build containers are ~8GB; this build peaks near 6GB and was
    // flakily OOM-killed (SIGKILL) on deploy. Trade a little build speed for a
    // markedly lower webpack memory ceiling so deploys are reliable.
    webpackMemoryOptimizations: true
  },
  images: {
    deviceSizes: [320, 420, 640, 768, 1024, 1280],
    formats: ['image/avif', 'image/webp'],
    imageSizes: [56, 96, 128, 256, 384],
    localPatterns: [
      { pathname: '/api/images' }
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.axfood.se' },
      { protocol: 'https', hostname: 'images.openfoodfacts.org' },
      { protocol: 'https', hostname: 'images.openbeautyfacts.org' }
    ]
  },
  reactStrictMode: true,
  async redirects() {
    // The "/index" route was renamed to "/grocery-index": a route literally named
    // `index` collides with Next's root-`/` build output (`app/index.*`), so its
    // server bundle (`app/index/page.js`) is never emitted and Vercel's Linux file
    // collector fails with ENOENT. Preserve the old URLs for links/SEO.
    return [
      { source: '/index', destination: '/grocery-index', permanent: true },
      { source: '/index/:symbol', destination: '/grocery-index/:symbol', permanent: true }
    ];
  }
};

export default withNextIntl(nextConfig);
