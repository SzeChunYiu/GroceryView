import { allergySuffererPersona } from '../personas/allergy-sufferer.js';
import ecoConsciousPersona from '../personas/eco-conscious.js';
import { restaurantOwnerPersona } from '../personas/restaurant-owner.js';
import { studentPersona } from '../personas/student.js';

const personas = [studentPersona, allergySuffererPersona, ecoConsciousPersona, restaurantOwnerPersona] as const;

type Persona = (typeof personas)[number];

export type SwitchCountryTaskStep = {
  id: string;
  userAction: string;
  expectedUiAffordance: string;
  acceptableVariations: readonly string[];
  frictionSignals: readonly string[];
};

export type SwitchCountryStepObservation = {
  acceptableVariationUsed?: string;
  affordanceFound: boolean;
  notes?: string;
  personaId: string;
  stepId: string;
};

export type SwitchCountryFrictionEntry = {
  acceptableVariationUsed?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  stepId: string;
};

export type SwitchCountryPersonaRunLog = {
  friction: SwitchCountryFrictionEntry[];
  personaId: string;
  personaLabel: string;
  taskId: 'switch-country-SE-to-NO';
};

function personaLabel(persona: Persona) {
  if ('label' in persona) return persona.label;
  return persona.name;
}

function frictionForObservation(step: SwitchCountryTaskStep, observation: SwitchCountryStepObservation | undefined): SwitchCountryFrictionEntry | null {
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

export const switchCountrySeToNoTask = {
  id: 'switch-country-SE-to-NO',
  label: 'Switch the grocery market from Sweden to Norway',
  entryPage: '/se',
  personas: personas.map((persona) => persona.id),
  guardrails: [
    'Country switching must not silently keep Swedish stores, currency, or source labels after Norway is selected.',
    'Norway readiness gaps must be explicit; do not invent Norwegian prices, stores, or offer coverage.',
    'The selected country must be reversible so personas can return to Sweden without losing their task context.'
  ],
  steps: [
    {
      id: 'find-country-control',
      userAction: 'Start on the Swedish GroceryView surface and look for a country or market switcher.',
      expectedUiAffordance: 'A visible country, market, locale, or flag control that currently indicates Sweden or SE.',
      acceptableVariations: [
        'The switcher is in the global navigation, footer, or settings menu.',
        'A search command or keyboard shortcut can open the country selector.',
        'A country-specific URL such as /se exposes a clear route back to the market picker.'
      ],
      frictionSignals: [
        'The current country is hidden or only implied by Swedish prices.',
        'The control is labelled language-only even though it changes market data.'
      ]
    },
    {
      id: 'open-country-menu',
      userAction: 'Open the selector and scan the available markets.',
      expectedUiAffordance: 'A menu, dialog, or page lists Norway / Norge / NO alongside Sweden with clear market labels.',
      acceptableVariations: [
        'Norway is shown as coming soon if coverage is blocked.',
        'Nordic market cards are acceptable when the selected country is obvious.'
      ],
      frictionSignals: [
        'Norway is missing with no explanation.',
        'Language choices are mixed with country choices without data-coverage copy.'
      ]
    },
    {
      id: 'choose-norway',
      userAction: 'Select Norway as the active grocery market.',
      expectedUiAffordance: 'Selecting Norway updates the route, selected-country state, or market chip to NO/Norway.',
      acceptableVariations: [
        'The app asks for confirmation before leaving Swedish data.',
        'A disabled Norway option links to a coverage-readiness explanation.'
      ],
      frictionSignals: [
        'The click appears to do nothing.',
        'The app switches language but keeps Swedish market data without warning.'
      ]
    },
    {
      id: 'verify-norway-context',
      userAction: 'Check that the landing surface now reflects Norway.',
      expectedUiAffordance: 'Country context shows Norway/NO with NOK or an explicit Norwegian coverage/readiness state.',
      acceptableVariations: [
        'If no Norwegian prices exist, the page says Norway is not yet price-ready and withholds rankings.',
        'A stores or sources panel shows which Norwegian data sources are pending.'
      ],
      frictionSignals: [
        'Swedish SEK prices remain visible without a market mismatch caveat.',
        'Norwegian claims appear without source evidence.'
      ]
    },
    {
      id: 'preserve-or-reset-filters',
      userAction: 'Confirm what happened to the active search, dietary, store, or basket filters after switching.',
      expectedUiAffordance: 'Filters are either preserved when compatible or reset with a visible explanation of Norway coverage differences.',
      acceptableVariations: [
        'A banner lists dropped filters that are not available for Norway.',
        'The prior Swedish URL is offered as a back link.'
      ],
      frictionSignals: [
        'Filters disappear silently.',
        'Swedish-only filters keep returning empty Norwegian states without guidance.'
      ]
    },
    {
      id: 'return-to-sweden',
      userAction: 'Switch back from Norway to Sweden to verify the flow is reversible.',
      expectedUiAffordance: 'The same market control can select Sweden again and restore Swedish source/currency context.',
      acceptableVariations: [
        'Browser back returns to the prior Swedish route with the country chip updated.',
        'A market-readiness page includes a direct Sweden link.'
      ],
      frictionSignals: [
        'The user is trapped in a country-specific route.',
        'The UI mixes Norway and Sweden state after returning.'
      ]
    }
  ] satisfies readonly SwitchCountryTaskStep[]
} as const;

export function runSwitchCountrySeToNoSimulation(observations: readonly SwitchCountryStepObservation[] = []): SwitchCountryPersonaRunLog[] {
  return personas.map((persona) => {
    const friction = switchCountrySeToNoTask.steps.flatMap((step) => {
      const observation = observations.find((candidate) => candidate.personaId === persona.id && candidate.stepId === step.id);
      const entry = frictionForObservation(step, observation);
      return entry ? [entry] : [];
    });

    return {
      friction,
      personaId: persona.id,
      personaLabel: personaLabel(persona),
      taskId: switchCountrySeToNoTask.id
    };
  });
}

export type SwitchCountrySeToNoTask = typeof switchCountrySeToNoTask;
export type SwitchCountrySeToNoRunLog = ReturnType<typeof runSwitchCountrySeToNoSimulation>;
