export const CORS_ORIGINS = Object.freeze([
  'https://grocery-web-mu.vercel.app',
  'http://localhost:3000'
]);

export type CorsOrigin = (typeof CORS_ORIGINS)[number];

export function isAllowedCorsOrigin(origin: string): origin is CorsOrigin {
  return CORS_ORIGINS.includes(origin as CorsOrigin);
}
