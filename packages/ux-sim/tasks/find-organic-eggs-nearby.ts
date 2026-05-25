import { allergySuffererPersona } from '../personas/allergy-sufferer.js';
import ecoConsciousPersona from '../personas/eco-conscious.js';
import { restaurantOwnerPersona } from '../personas/restaurant-owner.js';
import { studentPersona } from '../personas/student.js';

const personas = [studentPersona, allergySuffererPersona, ecoConsciousPersona, restaurantOwnerPersona] as const;

type Persona = (typeof personas)[number];

export type OrganicEggsTaskStep = {
  id: string;
  userAction: string;
  expectedUiAffordance: string;
  acceptableVariations: readonly string[];
  frictionSignals: readonly string[];
};

export type OrganicEggsStepObservation = {
  acceptableVariationUsed?: string;
  affordanceFound: boolean;
  notes?: string;
  personaId: string;
  stepId: string;
};

export type OrganicEggsFrictionEntry = {
  acceptableVariationUsed?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  stepId: string;
};

export type OrganicEggsPersonaRunLog = {
  friction: OrganicEggsFrictionEntry[];
  personaId: string;
  personaLabel: string;
  taskId: 'find-organic-eggs-nearby';
};

function personaLabel(persona: Persona) {
  if ('label' in persona) return persona.label;
  return persona.name;
}

function frictionForObservation(step: OrganicEggsTaskStep, observation: OrganicEggsStepObservation | undefined): OrganicEggsFrictionEntry | null {
  if (!observation) {
    return {
      reason: `No simulator observation captured for ${step.expectedUiAffordance}.`,
      severity: 'medium',
      stepId: step.id
    };
  }

  if (observation.affordanceFound) return null;

  const acceptableVariationUsed = observation.acceptableVariationUsed && step.acceptableVariations.includes(observation.acceptableVariationUsed)
    ? observation.acceptableVariationUsed
    : undefined;

  return {
    acceptableVariationUsed,
    reason: observation.notes ?? step.frictionSignals[0] ?? 'Expected affordance was not visible.',
    severity: acceptableVariationUsed ? 'low' : 'high',
    stepId: step.id
  };
}

export const findOrganicEggsNearbyTask = {
  id: 'find-organic-eggs-nearby',
  label: 'Find organic eggs nearby',
  entryPage: '/products?q=organic%20eggs',
  personas: personas.map((persona) => persona.id),
  guardrails: [
    'Do not infer organic, KRAV, EU-ekologisk, allergen, stock, or nearby-store claims without visible source-backed evidence.',
    'Nearby means the UI exposes city, district, map viewport, or store-distance context before ranking a store.',
    'The final choice must keep package size, unit price, freshness, and membership requirements visible.'
  ],
  steps: [
    {
      id: 'start-product-search',
      userAction: 'Search for organic eggs from the public product search or global search box.',
      expectedUiAffordance: 'A search field accepts egg terms and keeps a visible Products result surface with source/freshness copy.',
      acceptableVariations: [
        'A category shortcut for eggs or dairy opens the same filtered results.',
        'Voice or barcode search may substitute if it lands on organic egg candidates.',
        'No-result handling offers related egg terms without fabricating products.'
      ],
      frictionSignals: [
        'Egg search routes to unrelated pantry products.',
        'Search results do not explain whether rows are verified or stale.'
      ]
    },
    {
      id: 'apply-organic-filter',
      userAction: 'Apply an organic/KRAV/EU-ekologisk filter or choose an explicitly organic result.',
      expectedUiAffordance: 'Organic evidence is a visible filter chip, badge, or product label tied to source-backed certification text.',
      acceptableVariations: [
        'KRAV and EU-ekologisk are separate filters if the UI explains both count as organic evidence.',
        'If no organic evidence exists, the UI states that organic eggs are unavailable rather than falling back to ordinary eggs.'
      ],
      frictionSignals: [
        'Organic claims appear only in marketing copy with no verified label.',
        'Unlabelled eggs remain mixed into the filtered result set.'
      ]
    },
    {
      id: 'set-nearby-context',
      userAction: 'Set the nearby context using city, district, store, or map area.',
      expectedUiAffordance: 'Location or store filters update results and state whether distance is exact, district-based, or unavailable.',
      acceptableVariations: [
        'Store chips such as ICA, Coop, Willys, or Lidl are acceptable when map distance is unavailable.',
        'A privacy-preserving city fallback is acceptable when precise location is not requested.'
      ],
      frictionSignals: [
        'Nearby sorting is implied without a visible location input.',
        'The UI asks for location without a privacy or fallback explanation.'
      ]
    },
    {
      id: 'compare-unit-and-package',
      userAction: 'Compare organic egg candidates by package size, unit price, and current shelf or flyer price.',
      expectedUiAffordance: 'Rows show pack count or weight, price, comparable unit price, chain/store, and observed-at freshness near the ranking.',
      acceptableVariations: [
        'If pack count is missing, the row is marked incomplete and cannot win a unit-price recommendation.',
        'A compare drawer may show package evidence instead of inline row text.'
      ],
      frictionSignals: [
        'Cheapest result hides whether it is 6-pack, 10-pack, or weight-based.',
        'Missing package evidence is treated as the lowest unit price.',
        'Member-only or flyer-only prices are not labelled.'
      ]
    },
    {
      id: 'verify-store-detail',
      userAction: 'Open the best nearby organic egg option and verify the store/detail page.',
      expectedUiAffordance: 'The detail view repeats organic evidence, price source, distance/store context, package size, and last observed timestamp.',
      acceptableVariations: [
        'A product card expanded in place is acceptable if it exposes the same evidence.',
        'If store-level stock is missing, the UI says stock is unknown instead of claiming availability.'
      ],
      frictionSignals: [
        'Organic badge disappears on the detail view.',
        'The final store recommendation lacks source, freshness, or stock caveats.'
      ]
    },
    {
      id: 'save-or-route',
      userAction: 'Save the egg choice to a list, watchlist, or route-aware basket.',
      expectedUiAffordance: 'A save action preserves the organic filter, chosen store context, package evidence, and price caveat.',
      acceptableVariations: [
        'Anonymous users may get a local-list fallback with sign-in copy.',
        'Route planning may substitute for a saved list when it preserves the chosen store and product.'
      ],
      frictionSignals: [
        'Saving strips organic or nearby context.',
        'The user cannot preserve the comparison after finding a viable option.'
      ]
    }
  ] satisfies readonly OrganicEggsTaskStep[]
} as const;

export function runFindOrganicEggsNearbySimulation(observations: readonly OrganicEggsStepObservation[] = []): OrganicEggsPersonaRunLog[] {
  return personas.map((persona) => {
    const friction = findOrganicEggsNearbyTask.steps.flatMap((step) => {
      const observation = observations.find((candidate) => candidate.personaId === persona.id && candidate.stepId === step.id);
      const entry = frictionForObservation(step, observation);
      return entry ? [entry] : [];
    });

    return {
      friction,
      personaId: persona.id,
      personaLabel: personaLabel(persona),
      taskId: findOrganicEggsNearbyTask.id
    };
  });
}

export type FindOrganicEggsNearbyTask = typeof findOrganicEggsNearbyTask;
export type FindOrganicEggsNearbyRunLog = ReturnType<typeof runFindOrganicEggsNearbySimulation>;
