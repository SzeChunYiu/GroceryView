import { LegalPolicyPage } from '@/components/legal-policy-content';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/sv/cookies');
}

export default function SwedishCookiePolicyPage() {
  return <LegalPolicyPage kind="cookies" locale="sv" />;
}
