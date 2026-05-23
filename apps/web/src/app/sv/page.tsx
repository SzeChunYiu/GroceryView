import { LocaleHomePage, localeHomeMetadata } from '@/components/locale-home-page';

export function generateMetadata() {
  return localeHomeMetadata('sv');
}

export default function SwedishLocalePage() {
  return <LocaleHomePage locale="sv" />;
}
