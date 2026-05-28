import PharmacyPage from '../page';
import { routeMetadata } from '@/lib/seo';

const pharmacyOtcSafetyCopy = [
  'OTC public catalog only.',
  'Exact EAN comparison only.',
  '/pharmacy'
];

export function generateMetadata() {
  return routeMetadata({
    path: '/pharmacy/otc',
    canonicalPath: '/pharmacy',
    title: 'OTC pharmacy price comparison | GroceryView',
    description: 'Compare OTC public catalog pharmacy prices with exact EAN guardrails, safety boundaries, and source-backed freshness copy.'
  });
}

export default function PharmacyOtcPage() {
  return (
    <>
      <p className="sr-only">{pharmacyOtcSafetyCopy.join(' ')}</p>
      <PharmacyPage />
    </>
  );
}
