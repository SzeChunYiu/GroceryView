import { allergySuffererPersona } from '../personas/allergy-sufferer.js';
import ecoConsciousPersona from '../personas/eco-conscious.js';
import { studentPersona } from '../personas/student.js';

const personas = [studentPersona, allergySuffererPersona, ecoConsciousPersona] as const;

type Persona = (typeof personas)[number];

export type EvChargingTaskStep = {
  id: string;
  userAction: string;
  expectedUiAffordance: string;
  acceptableVariations: readonly string[];
  frictionSignals: readonly string[];
};

export type EvChargingStepObservation = {
  acceptableVariationUsed?: string;
  affordanceFound: boolean;
  notes?: string;
  personaId: string;
  stepId: string;
};

export type EvChargingFrictionEntry = {
  acceptableVariationUsed?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  stepId: string;
};

export type EvChargingPersonaRunLog = {
  friction: EvChargingFrictionEntry[];
  personaId: string;
  personaLabel: string;
  taskId: 'find-EV-charging-cheapest';
};

function personaLabel(persona: Persona) {
  if ('label' in persona) return persona.label;
  return persona.name;
}

function frictionForObservation(step: EvChargingTaskStep, observation: EvChargingStepObservation | undefined): EvChargingFrictionEntry | null {
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

export const findEvChargingCheapestTask = {
  id: 'find-EV-charging-cheapest',
  label: 'Find the cheapest viable EV charging option',
  entryPage: '/fuel?mode=ev-charging',
  personas: personas.map((persona) => persona.id),
  guardrails: [
    'Do not invent charger prices, plug availability, live occupancy, route time, or station-level offers.',
    'If GroceryView only has fuel observations for a market, the UI must say EV charging evidence is missing instead of ranking fake chargers.',
    'Cheapest means total expected charging cost after visible kWh price, session fee, connector fit, speed band, distance, and freshness caveats are shown.'
  ],
  steps: [
    {
      id: 'open-energy-surface',
      userAction: 'Start from the public shell or navigation and open the fuel/energy price surface.',
      expectedUiAffordance: 'A visible Fuel, Energy, or Charging navigation item that lands on a price surface with source and freshness copy.',
      acceptableVariations: [
        'Global search for EV charging routes to the same surface.',
        'Direct /fuel link exposes a mode switch for EV charging.',
        'EV charging is marked unavailable with a clear data-readiness explanation.'
      ],
      frictionSignals: [
        'Fuel-only naming hides that charging could live here.',
        'No source/freshness context is visible before the user starts comparing.'
      ]
    },
    {
      id: 'select-ev-charging-mode',
      userAction: 'Switch from petrol/diesel fuel rows to EV charging prices.',
      expectedUiAffordance: 'A segmented control, tab, or filter labelled EV charging that separates kWh/session charging from kr/l fuel rows.',
      acceptableVariations: [
        'EV charging appears as a disabled tab with an explanation and source backlog link.',
        'A charging-specific route alias opens the same filtered state.'
      ],
      frictionSignals: [
        'Charging prices are mixed with fuel prices without units.',
        'Disabled or missing EV mode does not explain what evidence is absent.'
      ]
    },
    {
      id: 'set-location-or-route',
      userAction: 'Enter current city, destination, or route context to avoid irrelevant chargers.',
      expectedUiAffordance: 'A location or route field with privacy copy and a list/map update that keeps distance evidence separate from price evidence.',
      acceptableVariations: [
        'City or district chips can substitute for precise location.',
        'Map viewport filtering is accepted when it states that no private location is read by default.'
      ],
      frictionSignals: [
        'Cheapest chargers are ranked nationally with no distance or route caveat.',
        'The UI asks for location without explaining privacy or fallback behavior.'
      ]
    },
    {
      id: 'compare-total-charging-cost',
      userAction: 'Sort or scan options by the cheapest expected charging cost.',
      expectedUiAffordance: 'Ranked charger rows show kr/kWh, session fee if known, estimated total, observed-at timestamp, and confidence/freshness.',
      acceptableVariations: [
        'If total cost cannot be computed, rows show a blocked-cost state and the missing field.',
        'A source-backed price table is acceptable before map ranking if units and freshness are clear.'
      ],
      frictionSignals: [
        'Rows rank by nominal kWh price while hiding session fees.',
        'Missing prices look like zero-cost chargers.',
        'No confidence or freshness is visible near the cheapest claim.'
      ]
    },
    {
      id: 'filter-connector-and-speed',
      userAction: 'Filter to chargers that work for the user\'s car and time budget.',
      expectedUiAffordance: 'Connector and speed filters such as Type 2, CCS, AC, DC fast, and minimum kW are visible before choosing the cheapest option.',
      acceptableVariations: [
        'Vehicle profile presets apply connector and speed filters automatically.',
        'Unsupported connector data is shown as unknown and excluded from cheapest viable recommendations.'
      ],
      frictionSignals: [
        'The cheapest row may be unusable because connector compatibility is hidden.',
        'Speed is missing, so a slow charger can outrank a viable fast option without warning.'
      ]
    },
    {
      id: 'choose-cheapest-viable-station',
      userAction: 'Open the cheapest viable station and verify the decision.',
      expectedUiAffordance: 'The station detail summarizes why it is cheapest, shows source links, distance/route caveats, and avoids claiming live availability unless sourced.',
      acceptableVariations: [
        'A comparison drawer can substitute for a station detail page.',
        'If station-level evidence is not available, the UI stops at operator-level prices and says no station recommendation is possible.'
      ],
      frictionSignals: [
        'The final recommendation lacks source links or route caveats.',
        'The UI implies live charger availability without a live source.'
      ]
    },
    {
      id: 'save-alert-or-watch',
      userAction: 'Save the chosen charging view or create a price alert for a lower charging threshold.',
      expectedUiAffordance: 'A save-view or alert action creates an account-scoped or local fallback watch with threshold units in kr/kWh or total session cost.',
      acceptableVariations: [
        'Alert creation is disabled with an explanation until charger price observations exist.',
        'A saved view without notifications is acceptable when it preserves filters, route, connector, and sort state.'
      ],
      frictionSignals: [
        'Alert units are unclear or use kr/l instead of charging units.',
        'The user cannot preserve the comparison state after finding a viable charger.'
      ]
    }
  ] satisfies readonly EvChargingTaskStep[]
} as const;

export function runFindEvChargingCheapestSimulation(observations: readonly EvChargingStepObservation[] = []): EvChargingPersonaRunLog[] {
  return personas.map((persona) => {
    const friction = findEvChargingCheapestTask.steps.flatMap((step) => {
      const observation = observations.find((candidate) => candidate.personaId === persona.id && candidate.stepId === step.id);
      const entry = frictionForObservation(step, observation);
      return entry ? [entry] : [];
    });

    return {
      friction,
      personaId: persona.id,
      personaLabel: personaLabel(persona),
      taskId: findEvChargingCheapestTask.id
    };
  });
}

export type FindEvChargingCheapestTask = typeof findEvChargingCheapestTask;
export type FindEvChargingCheapestRunLog = ReturnType<typeof runFindEvChargingCheapestSimulation>;
