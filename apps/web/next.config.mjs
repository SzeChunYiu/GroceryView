/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: false
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.axfood.se' },
      { protocol: 'https', hostname: 'images.openfoodfacts.org' },
      { protocol: 'https', hostname: 'images.openbeautyfacts.org' }
    ]
  },
  reactStrictMode: true
};

export default nextConfig;
