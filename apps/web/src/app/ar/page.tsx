import { BlockedLocalePage, blockedLocaleMetadata } from '@/components/locale-home-page';

const blockedLocaleRouteEvidence = 'No machine-translated prices';
void blockedLocaleRouteEvidence;

export function generateMetadata() {
  return blockedLocaleMetadata('ar');
}

export default function ArabicLocalePage() {
  return <BlockedLocalePage locale="ar" />;
}
