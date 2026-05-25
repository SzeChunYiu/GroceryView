import { LegalPolicyPage } from '@/components/legal-policy-content';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/en/cookies');
}

export default function EnglishCookiePolicyPage() {
  return <LegalPolicyPage kind="cookies" locale="en" />;
}
