import type { MetadataRoute } from 'next';

const siteUrl = 'https://grocery-web-mu.vercel.app';
const sitemapUrl = 'https://grocery-web-mu.vercel.app/sitemap.xml';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/account',
        '/account/profile',
        '/login'
      ]
    },
    sitemap: sitemapUrl,
    host: siteUrl
  };
}
