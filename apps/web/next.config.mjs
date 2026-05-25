import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === '1'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: false
  },
  images: {
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

export default withBundleAnalyzer(nextConfig);
