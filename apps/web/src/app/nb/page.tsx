import { LocaleHomePage, localeHomeMetadata } from '@/components/locale-home-page';

export function generateMetadata() {
  return localeHomeMetadata('nb');
}

export default function NorwegianBokmalLocalePage() {
  return <LocaleHomePage locale="nb" />;
}
