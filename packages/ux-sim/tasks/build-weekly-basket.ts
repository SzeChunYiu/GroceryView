import { allergySuffererPersona } from '../personas/allergy-sufferer.js';
import ecoConsciousPersona from '../personas/eco-conscious.js';
import { powerUserPersona } from '../personas/power-user.js';
import { studentPersona } from '../personas/student.js';

const personas = [studentPersona, allergySuffererPersona, ecoConsciousPersona, powerUserPersona] as const;

type Persona = (typeof personas)[number];

export type BuildWeeklyBasketTaskStep = {
  id: string;
  userAction: string;
  expectedUiAffordance: string;
  acceptableVariations: readonly string[];
  frictionSignals: readonly string[];
};

export type BuildWeeklyBasketStepObservation = {
  acceptableVariationUsed?: string;
  affordanceFound: boolean;
  notes?: string;
  personaId: string;
  stepId: string;
};

export type BuildWeeklyBasketFrictionEntry = {
  acceptableVariationUsed?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  stepId: string;
};

export type BuildWeeklyBasketPersonaRunLog = {
  friction: BuildWeeklyBasketFrictionEntry[];
  personaId: string;
  personaLabel: string;
  taskId: 'build-weekly-basket';
};

function personaLabel(persona: Persona) {
  if ('label' in persona) return persona.label;
  return persona.name;
}

function frictionForObservation(step: BuildWeeklyBasketTaskStep, observation: BuildWeeklyBasketStepObservation | undefined): BuildWeeklyBasketFrictionEntry | null {
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

export const buildWeeklyBasketTask = {
  id: 'build-weekly-basket',
  label: 'Build a weekly grocery basket from verified prices',
  entryPage: '/weekly-basket',
  personas: personas.map((persona) => persona.id),
  guardrails: [
    'Basket totals must use visible verified product rows only; missing prices stay missing instead of estimated.',
    'Every substitution, coupon, or split-trip suggestion must keep source, unit, store, and confidence context visible.',
    'The task measures shopper friction across personas without assuming sign-in, car access, dietary safety, or live stock.'
  ],
  steps: [
    {
      id: 'open-weekly-basket-entry',
      userAction: 'Start from home navigation, bottom navigation, or search and open the weekly basket builder.',
      expectedUiAffordance: 'A visible Weekly basket, basket builder, or compare basket entry point opens a page with current verified price-source caveats.',
      acceptableVariations: [
        'The compare route can host the basket builder if the weekly-basket CTA preserves the task context.',
        'A saved-list route is acceptable when it explains that weekly totals come from verified catalogue rows.',
        'A fail-closed empty state is acceptable if it names the missing source rows.'
      ],
      frictionSignals: [
        'The entry point is hidden behind generic compare copy.',
        'The first screen promises a weekly total before any items or price sources are selected.'
      ]
    },
    {
      id: 'add-staple-items',
      userAction: 'Add common weekly staples such as milk, bread, fruit, coffee, and dinner ingredients.',
      expectedUiAffordance: 'Search, category chips, or starter basket controls add items with product name, package size, current price, and source label visible.',
      acceptableVariations: [
        'A starter basket can prefill staples if each row remains removable and traceable.',
        'Barcode or saved favourite shortcuts are acceptable if they land on the same verified row shape.'
      ],
      frictionSignals: [
        'Items are added with no package or unit context.',
        'Autocomplete inserts products that do not exist in the verified catalogue.'
      ]
    },
    {
      id: 'review-diet-budget-constraints',
      userAction: 'Apply budget, dietary, household, or sustainability constraints before comparing stores.',
      expectedUiAffordance: 'The basket shows budget target, avoided allergens/diets when available, household quantity assumptions, and a clear no-inference preference boundary.',
      acceptableVariations: [
        'Constraint controls may live in a drawer if active filters are summarized on the basket.',
        'If preferences are unavailable, the UI says they are not applied rather than silently inferring them.'
      ],
      frictionSignals: [
        'A persona with allergy needs cannot see whether unsafe products were filtered.',
        'Budget controls hide whether prices are per pack, per unit, or per basket.'
      ]
    },
    {
      id: 'compare-store-totals',
      userAction: 'Compare basket totals across nearby or selected store chains.',
      expectedUiAffordance: 'A store comparison table shows total, missing rows, substitutions, confidence, and store/source coverage for each chain.',
      acceptableVariations: [
        'Split-trip or delivery/pickup grouping is acceptable when it keeps item assignments visible.',
        'A chain can be disabled if it explains which item prices are missing.'
      ],
      frictionSignals: [
        'The cheapest store is announced while many line items are missing.',
        'Substitutions change item quality, brand, or size without a visible warning.'
      ]
    },
    {
      id: 'choose-substitutions-and-coupons',
      userAction: 'Inspect suggested swaps, coupon stacks, member prices, or private-label alternatives.',
      expectedUiAffordance: 'Each suggestion shows the original item, replacement item, savings, requirements, confidence, and an accept or ignore action.',
      acceptableVariations: [
        'Coupon-only suggestions may be grouped separately if membership requirements are visible.',
        'Private-label swaps are acceptable when same-category and package evidence is shown.'
      ],
      frictionSignals: [
        'Savings are shown without membership, coupon, or package-size caveats.',
        'The simulator cannot undo a substitution.'
      ]
    },
    {
      id: 'finalize-weekly-plan',
      userAction: 'Save, print, or share the weekly basket plan for shopping.',
      expectedUiAffordance: 'The final plan preserves selected store, total, item assignments, unavailable rows, confidence caveats, and a printable/shareable checklist.',
      acceptableVariations: [
        'A local-storage save is acceptable when account sync is unavailable.',
        'A print view or copied link is acceptable if it includes source and freshness caveats.'
      ],
      frictionSignals: [
        'The final plan loses substitutions or split-trip assignments.',
        'The shopper cannot tell which prices may be stale or unavailable in store.'
      ]
    }
  ] satisfies readonly BuildWeeklyBasketTaskStep[]
} as const;

export function runBuildWeeklyBasketSimulation(
  observations: readonly BuildWeeklyBasketStepObservation[] = []
): BuildWeeklyBasketPersonaRunLog[] {
  return personas.map((persona) => {
    const friction = buildWeeklyBasketTask.steps.flatMap((step) => {
      const observation = observations.find((candidate) => candidate.personaId === persona.id && candidate.stepId === step.id);
      const entry = frictionForObservation(step, observation);
      return entry ? [entry] : [];
    });

    return {
      friction,
      personaId: persona.id,
      personaLabel: personaLabel(persona),
      taskId: buildWeeklyBasketTask.id
    };
  });
}

export type BuildWeeklyBasketTask = typeof buildWeeklyBasketTask;
export type BuildWeeklyBasketRunLog = ReturnType<typeof runBuildWeeklyBasketSimulation>;
