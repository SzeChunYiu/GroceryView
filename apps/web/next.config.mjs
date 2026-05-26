/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: false
  },
  images: {
    // Bypass the optimizer's local query-string restriction (Next 16 blocks
    // query strings on local images unless each is whitelisted in localPatterns,
    // which can't match the variable `/api/images?src=…&w=…` proxy URLs).
    // Images still load via the app's own /api/images proxy + remotePatterns.
    unoptimized: true,
    deviceSizes: [320, 420, 640, 768, 1024, 1280],
    formats: ['image/avif', 'image/webp'],
    imageSizes: [56, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.axfood.se' },
      { protocol: 'https', hostname: 'images.openfoodfacts.org' },
      { protocol: 'https', hostname: 'images.openbeautyfacts.org' }
    ]
  },
  reactStrictMode: true
};

export default nextConfig;
