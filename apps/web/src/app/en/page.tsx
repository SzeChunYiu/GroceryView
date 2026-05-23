import { LocaleHomePage, localeHomeMetadata } from '@/components/locale-home-page';

export function generateMetadata() {
  return localeHomeMetadata('en');
}

export default function EnglishLocalePage() {
  return <LocaleHomePage locale="en" />;
}
