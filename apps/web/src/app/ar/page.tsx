import { BlockedLocalePage, blockedLocaleMetadata } from '@/components/locale-home-page';

export function generateMetadata() {
  return blockedLocaleMetadata('ar');
}

export default function ArabicLocalePage() {
  return <BlockedLocalePage locale="ar" />;
}
