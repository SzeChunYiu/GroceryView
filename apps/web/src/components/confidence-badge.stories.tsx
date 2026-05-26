import type { ComponentProps } from 'react';
import { ConfidenceBadge } from './confidence-badge';

type ConfidenceBadgeStoryProps = ComponentProps<typeof ConfidenceBadge>;

const meta = {
  title: 'Components/ConfidenceBadge',
  component: ConfidenceBadge
};

export default meta;

export const Default = {
  args: {
    level: 'medium'
  } satisfies ConfidenceBadgeStoryProps
};

export const WithData = {
  args: {
    level: 'high',
    label: 'ICA source confidence',
    observedAt: '2026-05-24T10:30:00Z',
    sampleSize: 18,
    verificationLabel: 'Receipt matched',
    details: [
      { label: 'Source rows', value: '18 matching observations across 4 stores' },
      { label: 'Latest row', value: 'Observed yesterday from ICA weekly feed' }
    ]
  } satisfies ConfidenceBadgeStoryProps
};

export const EdgeCase = {
  args: {
    level: 'low',
    label: 'Long partner marketplace confidence label with limited regional coverage',
    observedAt: null,
    sampleSize: 0,
    verificationLabel: '  Manual review pending  ',
    details: [
      { label: 'Coverage note', value: 'åäö labels, missing live stock, and no loyalty eligibility confirmation.' }
    ],
    locale: 'sv'
  } satisfies ConfidenceBadgeStoryProps
};
