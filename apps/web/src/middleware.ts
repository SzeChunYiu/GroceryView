import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, localeCookieName, normalizeLocale, resolveLocaleFromAcceptLanguage } from './lib/i18n-routing';

export function middleware(request: NextRequest) {
  const nextLocaleCookieName = localeCookieName; // NEXT_LOCALE
  const cookieLocale = normalizeLocale(request.cookies.get(nextLocaleCookieName)?.value);
  const resolvedLocale = cookieLocale ?? resolveLocaleFromAcceptLanguage(request.headers.get('accept-language')) ?? defaultLocale;
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  response.headers.set('x-groceryview-locale', resolvedLocale);
  response.headers.set('vary', 'accept-language');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)']
};
