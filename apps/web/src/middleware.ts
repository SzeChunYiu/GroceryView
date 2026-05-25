import { NextResponse, type NextRequest } from 'next/server';
import {
  blockedLocaleFromPathname,
  blockedLocaleRoutes,
  defaultLocale,
  localeCookieName,
  localeFromPathname,
  localeRoutePrefix,
  normalizeLocale,
  resolveLocaleFromAcceptLanguage
} from './lib/i18n-routing';
import { isPublicCatalogueLandingRoute, publicCatalogueCacheControl, publicCatalogueRevalidateSeconds } from './lib/seo';

export function middleware(request: NextRequest) {
  const nextLocaleCookieName = localeCookieName; // NEXT_LOCALE
  const routeLocale = localeFromPathname(request.nextUrl.pathname);
  const blockedLocaleRoute = blockedLocaleFromPathname(request.nextUrl.pathname);
  const cookieLocale = normalizeLocale(request.cookies.get(nextLocaleCookieName)?.value);
  const resolvedLocale = routeLocale ?? cookieLocale ?? resolveLocaleFromAcceptLanguage(request.headers.get('accept-language')) ?? defaultLocale;
  if (blockedLocaleRoute && blockedLocaleRoutes.includes(blockedLocaleRoute)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `${localeRoutePrefix(defaultLocale)}${request.nextUrl.pathname.replace(/^\/(?:ar|so)(?=\/|$)/, '') || '/'}`;
    const localeRedirectResponse = NextResponse.redirect(redirectUrl);
    localeRedirectResponse.headers.set('x-groceryview-locale-blocked', localeRoutePrefix(blockedLocaleRoute));
    return localeRedirectResponse;
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  response.headers.set('x-groceryview-locale', resolvedLocale);
  response.headers.set('x-groceryview-locale-route', routeLocale ? localeRoutePrefix(routeLocale) : 'unrouted');
  if (routeLocale) {
    response.cookies.set(nextLocaleCookieName, routeLocale, { sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  if (isPublicCatalogueLandingRoute(request.nextUrl.pathname)) {
    response.headers.set('Cache-Control', publicCatalogueCacheControl);
    response.headers.set('CDN-Cache-Control', publicCatalogueCacheControl);
    response.headers.set('Vercel-CDN-Cache-Control', publicCatalogueCacheControl);
    response.headers.set('x-groceryview-revalidate-seconds', String(publicCatalogueRevalidateSeconds));
  }
  response.headers.set('vary', 'accept-language');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)']
};
