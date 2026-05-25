import { ActiveFilterChips } from './FilterPanel';
import type { RemovableSearchFilterChip } from '@/lib/search-filters';

const meta = {
  title: 'Components/FilterChips',
  component: ActiveFilterChips
};

export default meta;

const withDataChips: RemovableSearchFilterChip[] = [
  { id: 'category-dairy', label: 'Dairy', href: '/products?chain=ica' },
  { id: 'diet-vegan', label: 'Vegan', href: '/products?category=dairy' },
  { id: 'price-50', label: 'Under 50 kr', href: '/products?category=dairy&dietary=vegan' }
];

const edgeCaseChips: RemovableSearchFilterChip[] = [
  { id: 'long-origin-label', label: 'Origin: Sweden, Norway, and Iceland only', href: '/products' },
  { id: 'confidence', label: 'Confidence ≥ 95%', href: '/products?origin=se,no,is' },
  { id: 'brand', label: 'Brand: Änglamark & Garant favorites', href: '/products?confidence=95' }
];

export const Default = {
  args: {
    chips: []
  }
};

export const WithData = {
  args: {
    chips: withDataChips
  }
};

export const EdgeCase = {
  args: {
    chips: edgeCaseChips
  }
};
