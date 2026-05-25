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

function frictionForObservation(step: SubmitPriceCorrectionTaskStep, observation: SubmitPriceCorrectionStepObservation | undefined): SubmitPriceCorrectionFrictionEntry | null {
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
  label: 'Submit a price correction for a visible product row',
  entryPage: '/products',
  personas: personas.map((persona) => persona.id),
  guardrails: [
    'Do not encourage anonymous private account data; correction evidence must be source-backed or explicitly user-reported.',
    'Never overwrite a verified price immediately after submission; route the correction to review or moderation.',
    'The user must see which product, store, price type, and observed date will be corrected before submitting.'
  ],
  steps: [
    {
      id: 'find-price-row',
      userAction: 'Open product search, a deal card, or product detail and locate the price that looks wrong.',
      expectedUiAffordance: 'A visible product price row with product name, store or chain, price, unit, source, and observed-at freshness.',
      acceptableVariations: [
        'A compare table row or deal card can be used if it exposes the same product/store/source context.',
        'A scanner result may deep-link directly to the product row needing correction.'
      ],
      frictionSignals: [
        'The row hides store, unit, or source freshness, so the user cannot verify the correction target.',
        'Multiple visually similar rows make it unclear which price will be corrected.'
      ]
    },
    {
      id: 'open-correction-action',
      userAction: 'Choose the report, correct price, or flag issue action for that exact row.',
      expectedUiAffordance: 'A row-scoped correction action that keeps the selected product and store context visible.',
      acceptableVariations: [
        'A global Report price issue action is acceptable if it pre-fills the selected row after activation.',
        'A moderation drawer may open instead of a full page when the row context remains pinned.'
      ],
      frictionSignals: [
        'The correction action is only available at page level and loses the selected row.',
        'The user must copy product or store details manually into the form.'
      ]
    },
    {
      id: 'enter-corrected-price',
      userAction: 'Enter the corrected price, unit price if known, currency, price type, and observed date.',
      expectedUiAffordance: 'A correction form with numeric price input, unit/currency labels, price type, and observed-at date fields.',
      acceptableVariations: [
        'Unit price can be optional when pack size evidence is missing and the UI explains the review limitation.',
        'Currency may be fixed to SEK if the market and row evidence are Swedish only.'
      ],
      frictionSignals: [
        'The form accepts ambiguous text prices without unit or currency context.',
        'Observed date is missing, making stale corrections look current.'
      ]
    },
    {
      id: 'attach-evidence',
      userAction: 'Add evidence such as receipt text, shelf label photo note, source URL, or retailer page reference.',
      expectedUiAffordance: 'Evidence fields explain accepted proof and privacy limits before any upload or text entry.',
      acceptableVariations: [
        'A source URL plus free-text note is acceptable when image upload is not available.',
        'Receipt OCR evidence can be referenced by an existing private scan id without showing the image publicly.'
      ],
      frictionSignals: [
        'The UI asks for a receipt or photo without privacy copy.',
        'Evidence is optional without explaining that low-evidence reports go to review.'
      ]
    },
    {
      id: 'review-before-submit',
      userAction: 'Review the correction summary before sending.',
      expectedUiAffordance: 'A summary shows old price, proposed price, product, store, source, evidence type, and moderation outcome.',
      acceptableVariations: [
        'Inline confirmation is acceptable when every correction field remains visible above the submit button.',
        'A disabled submit button with missing-field hints is acceptable until required evidence is complete.'
      ],
      frictionSignals: [
        'The submit button appears before the user can compare old and corrected values.',
        'Moderation or trust impact is not explained.'
      ]
    },
    {
      id: 'submit-and-confirm',
      userAction: 'Submit the correction and confirm the app acknowledges review status.',
      expectedUiAffordance: 'A success state returns a correction id, review status, and next-step copy without immediately changing verified prices.',
      acceptableVariations: [
        'A queued-for-review toast is acceptable if it includes how to find the correction later.',
        'Rate-limit or validation errors are acceptable if fields retain user-entered values.'
      ],
      frictionSignals: [
        'Submission fails silently or clears the form without a correction id.',
        'The page appears to update the verified price before review completes.'
      ]
    }
  ] satisfies readonly SubmitPriceCorrectionTaskStep[]
} as const;

export function runSubmitPriceCorrectionSimulation(observations: readonly SubmitPriceCorrectionStepObservation[] = []): SubmitPriceCorrectionPersonaRunLog[] {
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
