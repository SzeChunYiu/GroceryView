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

export function middleware(request: NextRequest) {
  const nextLocaleCookieName = localeCookieName; // NEXT_LOCALE
  const routeLocale = localeFromPathname(request.nextUrl.pathname);
  const blockedLocaleRoute = blockedLocaleFromPathname(request.nextUrl.pathname);
  const cookieLocale = normalizeLocale(request.cookies.get(nextLocaleCookieName)?.value);
  const resolvedLocale = routeLocale ?? cookieLocale ?? resolveLocaleFromAcceptLanguage(request.headers.get('accept-language')) ?? defaultLocale;
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  response.headers.set('x-groceryview-locale', resolvedLocale);
  response.headers.set('x-groceryview-locale-route', routeLocale ? localeRoutePrefix(routeLocale) : 'unrouted');
  if (blockedLocaleRoute && blockedLocaleRoutes.includes(blockedLocaleRoute)) {
    response.headers.set('x-groceryview-locale-blocked', localeRoutePrefix(blockedLocaleRoute));
  }
  response.headers.set('vary', 'accept-language');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)']
};
