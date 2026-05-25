import { LegalPolicyPage } from '@/components/legal-policy-content';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/sv/privacy');
}

export default function SwedishPrivacyPolicyPage() {
  return <LegalPolicyPage kind="privacy" locale="sv" />;
}
