import { LegalPolicyPage } from '@/components/legal-policy-content';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/en/privacy');
}

export default function EnglishPrivacyPolicyPage() {
  return <LegalPolicyPage kind="privacy" locale="en" />;
}
