import { BlockedLocalePage, blockedLocaleMetadata } from '@/components/locale-home-page';

export function generateMetadata() {
  return blockedLocaleMetadata('so');
}

export default function SomaliLocalePage() {
  return <BlockedLocalePage locale="so" />;
}
