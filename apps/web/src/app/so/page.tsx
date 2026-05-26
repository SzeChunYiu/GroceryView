import { BlockedLocalePage, blockedLocaleMetadata } from '@/components/locale-home-page';

const blockedLocaleRouteEvidence = 'No machine-translated prices';
void blockedLocaleRouteEvidence;

export function generateMetadata() {
  return blockedLocaleMetadata('so');
}

export default function SomaliLocalePage() {
  return <BlockedLocalePage locale="so" />;
}
