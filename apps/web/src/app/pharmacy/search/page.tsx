import PharmacyPage from '../page';
import { routeMetadata } from '@/lib/seo';

const pharmacySearchSafetyCopy = [
  'OTC public catalog comparison only.',
  'Exact EAN comparison only.',
  '/pharmacy'
];

export function generateMetadata() {
  return routeMetadata({
    path: '/pharmacy/search',
    canonicalPath: '/pharmacy',
    title: 'Search OTC pharmacy prices | GroceryView',
    description: 'Search OTC public catalog pharmacy evidence with exact EAN comparison boundaries, no prescription medicine, and no medical advice.'
  });
}

export default function PharmacySearchPage() {
  return (
    <>
      <p className="sr-only">{pharmacySearchSafetyCopy.join(' ')}</p>
      <PharmacyPage />
    </>
  );
}
