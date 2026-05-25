import { allergySuffererPersona } from '../personas/allergy-sufferer.js';
import ecoConsciousPersona from '../personas/eco-conscious.js';
import { restaurantOwnerPersona } from '../personas/restaurant-owner.js';
import { studentPersona } from '../personas/student.js';

const personas = [studentPersona, allergySuffererPersona, ecoConsciousPersona, restaurantOwnerPersona] as const;

type Persona = (typeof personas)[number];

export type CoffeePriceAlertTaskStep = {
  id: string;
  userAction: string;
  expectedUiAffordance: string;
  acceptableVariations: readonly string[];
  frictionSignals: readonly string[];
};

export type CoffeePriceAlertStepObservation = {
  acceptableVariationUsed?: string;
  affordanceFound: boolean;
  notes?: string;
  personaId: string;
  stepId: string;
};

export type CoffeePriceAlertFrictionEntry = {
  acceptableVariationUsed?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  stepId: string;
};

export type CoffeePriceAlertPersonaRunLog = {
  friction: CoffeePriceAlertFrictionEntry[];
  personaId: string;
  personaLabel: string;
  taskId: 'set-price-alert-on-coffee';
};

function personaLabel(persona: Persona) {
  if ('label' in persona) return persona.label;
  return persona.name;
}

function frictionForObservation(step: CoffeePriceAlertTaskStep, observation: CoffeePriceAlertStepObservation | undefined): CoffeePriceAlertFrictionEntry | null {
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

export const setPriceAlertOnCoffeeTask = {
  id: 'set-price-alert-on-coffee',
  label: 'Set a price alert on coffee',
  entryPage: '/products?q=coffee',
  personas: personas.map((persona) => persona.id),
  guardrails: [
    'Do not invent coffee prices, retailer coverage, discount depth, or notification delivery guarantees.',
    'Every alert threshold must keep currency and unit context visible, such as kr/package or comparable kr/kg.',
    'If sign-in is required for notifications, the UI must offer a clear account prompt or local saved-search fallback.'
  ],
  steps: [
    {
      id: 'open-product-search',
      userAction: 'Open the product search surface from navigation or the home search box.',
      expectedUiAffordance: 'A visible Products, Search, or global search affordance that accepts coffee as a query.',
      acceptableVariations: [
        'A deals or watchlist entry point can route directly into product search with coffee prefilled.',
        'A barcode scanner shortcut is acceptable if it also exposes text search for coffee.'
      ],
      frictionSignals: [
        'Coffee search is hidden behind unrelated deal or category labels.',
        'The search field does not preserve the query after navigation.'
      ]
    },
    {
      id: 'find-coffee-product',
      userAction: 'Search for coffee and choose a relevant coffee product result.',
      expectedUiAffordance: 'Coffee results show product name, brand, current observed price, store or chain, and freshness/source context.',
      acceptableVariations: [
        'A coffee category chip can narrow the list before choosing a product.',
        'A product comparison row can substitute for a card if it links to the same product detail.'
      ],
      frictionSignals: [
        'Coffee products appear without prices or source freshness.',
        'Sponsored or unrelated products outrank source-backed coffee results without explanation.'
      ]
    },
    {
      id: 'open-alert-action',
      userAction: 'Open the product detail or card action for creating a price alert.',
      expectedUiAffordance: 'A clear Price alert, Watch price, or Notify me action is visible near the coffee price evidence.',
      acceptableVariations: [
        'A heart/save action is acceptable if it immediately reveals a target-price control.',
        'A disabled alert action is acceptable when it explains the missing account or notification permission requirement.'
      ],
      frictionSignals: [
        'The alert action is only available after scrolling past unrelated content.',
        'Save and alert actions are visually indistinguishable.'
      ]
    },
    {
      id: 'set-threshold',
      userAction: 'Enter a target coffee price threshold below the current observed price.',
      expectedUiAffordance: 'The threshold input shows SEK currency, unit context, current price, and validation for realistic lower-than-current values.',
      acceptableVariations: [
        'Preset threshold chips such as 5% off, 10% off, or under 50 kr are acceptable.',
        'Comparable-unit thresholds are acceptable when the UI states the package-size conversion.'
      ],
      frictionSignals: [
        'The threshold field accepts unitless numbers.',
        'The UI allows thresholds above the current price without explaining instant-trigger behavior.'
      ]
    },
    {
      id: 'choose-scope-and-channel',
      userAction: 'Choose which stores/chains and notification channel the alert should monitor.',
      expectedUiAffordance: 'Store or chain scope and email, push, or in-app notification options are visible before saving.',
      acceptableVariations: [
        'Default all verified stores is acceptable if the scope summary is explicit.',
        'In-app only alerts are acceptable when email or push setup is unavailable.'
      ],
      frictionSignals: [
        'The user cannot tell whether the alert watches one product, one chain, or all stores.',
        'Notification permission or sign-in is requested without explaining why.'
      ]
    },
    {
      id: 'save-alert',
      userAction: 'Save the coffee price alert and confirm it is active.',
      expectedUiAffordance: 'A success confirmation repeats the coffee product, threshold, scope, channel, and source freshness caveat.',
      acceptableVariations: [
        'A watchlist page row can serve as confirmation if it shows the same alert details.',
        'A local saved alert fallback is acceptable when account sync is unavailable.'
      ],
      frictionSignals: [
        'Saving gives no confirmation or hides the threshold that was saved.',
        'The confirmation implies guaranteed price drops or delivery without source-backed caveats.'
      ]
    }
  ] satisfies readonly CoffeePriceAlertTaskStep[]
} as const;

export function runSetPriceAlertOnCoffeeSimulation(observations: readonly CoffeePriceAlertStepObservation[] = []): CoffeePriceAlertPersonaRunLog[] {
  return personas.map((persona) => {
    const friction = setPriceAlertOnCoffeeTask.steps.flatMap((step) => {
      const observation = observations.find((candidate) => candidate.personaId === persona.id && candidate.stepId === step.id);
      const entry = frictionForObservation(step, observation);
      return entry ? [entry] : [];
    });

    return {
      friction,
      personaId: persona.id,
      personaLabel: personaLabel(persona),
      taskId: setPriceAlertOnCoffeeTask.id
    };
  });
}

export type SetPriceAlertOnCoffeeTask = typeof setPriceAlertOnCoffeeTask;
export type SetPriceAlertOnCoffeeRunLog = ReturnType<typeof runSetPriceAlertOnCoffeeSimulation>;
