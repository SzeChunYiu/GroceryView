import { allergySuffererPersona } from '../personas/allergy-sufferer.js';
import ecoConsciousPersona from '../personas/eco-conscious.js';
import { restaurantOwnerPersona } from '../personas/restaurant-owner.js';
import { studentPersona } from '../personas/student.js';

const personas = [studentPersona, allergySuffererPersona, ecoConsciousPersona, restaurantOwnerPersona] as const;

type Persona = (typeof personas)[number];

export type SubmitPriceCorrectionTaskStep = {
  id: string;
  userAction: string;
  expectedUiAffordance: string;
  acceptableVariations: readonly string[];
  frictionSignals: readonly string[];
};

export type SubmitPriceCorrectionStepObservation = {
  acceptableVariationUsed?: string;
  affordanceFound: boolean;
  notes?: string;
  personaId: string;
  stepId: string;
};

export type SubmitPriceCorrectionFrictionEntry = {
  acceptableVariationUsed?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  stepId: string;
};

export type SubmitPriceCorrectionPersonaRunLog = {
  friction: SubmitPriceCorrectionFrictionEntry[];
  personaId: string;
  personaLabel: string;
  taskId: 'submit-price-correction';
};

function personaLabel(persona: Persona) {
  if ('label' in persona) return persona.label;
  return persona.name;
}

function frictionForObservation(
  step: SubmitPriceCorrectionTaskStep,
  observation: SubmitPriceCorrectionStepObservation | undefined,
): SubmitPriceCorrectionFrictionEntry | null {
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

export const submitPriceCorrectionTask = {
  id: 'submit-price-correction',
  label: 'Submit a correction for an incorrect grocery price',
  entryPage: '/products',
  personas: personas.map((persona) => persona.id),
  guardrails: [
    'Do not imply a corrected price is live until GroceryView has review or source verification.',
    'A correction must keep store, product, observed price, currency, unit/package context, and evidence separated.',
    'Anonymous submissions may be accepted only with clear privacy, anti-abuse, and follow-up limitations.'
  ],
  steps: [
    {
      id: 'find-price-row',
      userAction: 'Open a product or store price row that appears incorrect.',
      expectedUiAffordance: 'A product, deal, or store row exposes the observed price, store/source, package size, and observation freshness before correction starts.',
      acceptableVariations: [
        'Search results can start the flow if the selected result keeps product and store context.',
        'A receipt or barcode scan result can substitute for a product page when it shows the matched item.'
      ],
      frictionSignals: [
        'The user cannot tell which store or package size the price belongs to.',
        'Correction starts from a generic form with no product context carried forward.'
      ]
    },
    {
      id: 'open-correction-action',
      userAction: 'Choose the report, edit, or correct-price action for that row.',
      expectedUiAffordance: 'A visible action labelled Report price issue, Correct price, or Suggest correction opens a scoped correction form.',
      acceptableVariations: [
        'A kebab menu or details drawer is acceptable when the report action is discoverable and keyboard accessible.',
        'If corrections are disabled, the UI explains whether sign-in, source freshness, or moderation backlog is the blocker.'
      ],
      frictionSignals: [
        'The correction action is hidden behind unrelated feedback copy.',
        'Disabled correction controls do not explain how to proceed.'
      ]
    },
    {
      id: 'enter-correct-price',
      userAction: 'Enter the corrected shelf price and unit/package details.',
      expectedUiAffordance: 'Inputs capture price, currency, unit price or package size, store, and observed-at date with validation for decimals and units.',
      acceptableVariations: [
        'The form may prefill store, currency, and package fields from the selected price row.',
        'A photo-first receipt flow is acceptable if it still allows manual price/unit confirmation.'
      ],
      frictionSignals: [
        'The form accepts ambiguous numbers without currency or unit labels.',
        'The user must re-enter known product or store details that were already visible.'
      ]
    },
    {
      id: 'attach-evidence',
      userAction: 'Attach or describe evidence for the correction.',
      expectedUiAffordance: 'An optional receipt, shelf-label photo, source URL, or note field explains what evidence is useful and what private data to avoid.',
      acceptableVariations: [
        'A no-photo path is acceptable when the form asks for source notes and flags the correction for manual review.',
        'Receipt upload may redact loyalty identifiers before submission.'
      ],
      frictionSignals: [
        'Evidence upload asks for sensitive receipt data without privacy guidance.',
        'The form makes evidence mandatory even when a source URL or text note would be sufficient.'
      ]
    },
    {
      id: 'review-before-submit',
      userAction: 'Review the correction summary before sending.',
      expectedUiAffordance: 'A confirmation summary contrasts current stored price with submitted correction and states that review is required before publishing.',
      acceptableVariations: [
        'Inline validation summary is acceptable if it lists old price, new price, store, unit, and evidence state.',
        'A moderated queue notice can replace a separate review screen on small screens.'
      ],
      frictionSignals: [
        'The user cannot verify the old-vs-new price delta before submitting.',
        'The UI suggests the price will update instantly without review.'
      ]
    },
    {
      id: 'submit-and-track',
      userAction: 'Submit the correction and find the follow-up state.',
      expectedUiAffordance: 'Submission shows a success state with ticket/reference ID, moderation status, undo/edit window, and notification or local tracking option.',
      acceptableVariations: [
        'Anonymous submissions can show a local reference only, with clear limitations.',
        'Signed-in users may route to a correction history page instead of an inline status card.'
      ],
      frictionSignals: [
        'After submitting, there is no confirmation that the correction was received.',
        'The user cannot tell whether GroceryView will notify them or how to revise a mistaken report.'
      ]
    }
  ] satisfies readonly SubmitPriceCorrectionTaskStep[]
} as const;

export function runSubmitPriceCorrectionSimulation(
  observations: readonly SubmitPriceCorrectionStepObservation[] = [],
): SubmitPriceCorrectionPersonaRunLog[] {
  return personas.map((persona) => {
    const friction = submitPriceCorrectionTask.steps.flatMap((step) => {
      const observation = observations.find((candidate) => candidate.personaId === persona.id && candidate.stepId === step.id);
      const entry = frictionForObservation(step, observation);
      return entry ? [entry] : [];
    });

    return {
      friction,
      personaId: persona.id,
      personaLabel: personaLabel(persona),
      taskId: submitPriceCorrectionTask.id
    };
  });
}

export type SubmitPriceCorrectionTask = typeof submitPriceCorrectionTask;
export type SubmitPriceCorrectionRunLog = ReturnType<typeof runSubmitPriceCorrectionSimulation>;
