import { allergySuffererPersona } from '../personas/allergy-sufferer.js';
import ecoConsciousPersona from '../personas/eco-conscious.js';
import { restaurantOwnerPersona } from '../personas/restaurant-owner.js';
import { studentPersona } from '../personas/student.js';

const personas = [studentPersona, allergySuffererPersona, ecoConsciousPersona, restaurantOwnerPersona] as const;

type Persona = (typeof personas)[number];

export type PharmacyOtcPainReliefTaskStep = {
  id: string;
  userAction: string;
  expectedUiAffordance: string;
  acceptableVariations: readonly string[];
  frictionSignals: readonly string[];
};

export type PharmacyOtcPainReliefStepObservation = {
  acceptableVariationUsed?: string;
  affordanceFound: boolean;
  notes?: string;
  personaId: string;
  stepId: string;
};

export type PharmacyOtcPainReliefFrictionEntry = {
  acceptableVariationUsed?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  stepId: string;
};

export type PharmacyOtcPainReliefPersonaRunLog = {
  friction: PharmacyOtcPainReliefFrictionEntry[];
  personaId: string;
  personaLabel: string;
  taskId: 'compare-pharmacy-OTC-pain-relief';
};

function personaLabel(persona: Persona) {
  if ('label' in persona) return persona.label;
  return persona.name;
}

function frictionForObservation(
  step: PharmacyOtcPainReliefTaskStep,
  observation: PharmacyOtcPainReliefStepObservation | undefined
): PharmacyOtcPainReliefFrictionEntry | null {
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

export const comparePharmacyOtcPainReliefTask = {
  id: 'compare-pharmacy-OTC-pain-relief',
  label: 'Compare OTC pain-relief prices without medical claims',
  entryPage: '/pharmacy?category=pain-relief',
  personas: personas.map((persona) => persona.id),
  guardrails: [
    'Only compare public OTC catalog or observation evidence; do not include prescription medicine or medical advice.',
    'Pain-relief rows must keep active ingredient, strength, package count, source URL, and retrieved/observed time visible before price ranking.',
    'Do not claim live stock, pharmacy-chain coverage, dosage suitability, or a cheapest pharmacy unless the supporting evidence is visible.'
  ],
  steps: [
    {
      id: 'open-pharmacy-otc-surface',
      userAction: 'Start from navigation, search, or the products page and open the pharmacy OTC board.',
      expectedUiAffordance: 'A visible Pharmacy or OTC entry point lands on /pharmacy with copy explaining public OTC evidence and the no-prescription boundary.',
      acceptableVariations: [
        'Homepage pharmacy OTC cards link to the same evidence board.',
        'Product search for paracetamol, ibuprofen, or pain relief routes to the pharmacy OTC board.',
        'The route shows an empty state when OTC evidence is missing, with the missing source named.'
      ],
      frictionSignals: [
        'Pharmacy is hidden under grocery categories with no OTC wording.',
        'The page implies a full pharmacy-chain comparison before connector-backed pharmacy observations exist.'
      ]
    },
    {
      id: 'select-pain-relief-category',
      userAction: 'Narrow the OTC evidence board to pain-relief tablets or gel.',
      expectedUiAffordance: 'A category filter, chip, or search result for pain relief shows matching OTC rows such as paracetamol or ibuprofen without prescription products.',
      acceptableVariations: [
        'A text search for Alvedon, Ipren, paracetamol, or ibuprofen is accepted if it preserves the OTC-only boundary.',
        'Pain-relief category is read-only but visibly groups the relevant public source rows.'
      ],
      frictionSignals: [
        'Pain-relief results mix supplements, beauty products, or prescription-only medicine without labels.',
        'The user cannot tell whether the filter searched active ingredient, brand, or category text.'
      ]
    },
    {
      id: 'verify-safety-boundaries',
      userAction: 'Check that the comparison is product-price evidence, not advice about which medicine to take.',
      expectedUiAffordance: 'Rows and page copy display no medical advice, no prescription medicine, and source-only caveats near the comparison controls.',
      acceptableVariations: [
        'A persistent disclaimer panel can cover the whole board if it remains visible while sorting.',
        'Product detail pages can carry the same caveat when the board links to individual rows.'
      ],
      frictionSignals: [
        'The UI recommends an active ingredient for a symptom or persona.',
        'Prescription, dosage, or suitability language appears without a source and boundary.'
      ]
    },
    {
      id: 'compare-like-for-like-package',
      userAction: 'Compare candidate products by active ingredient, strength, and pack size before trusting the cheapest row.',
      expectedUiAffordance: 'Each row exposes brand/name, active ingredient or category evidence, strength when present, package count/size, EAN/source evidence, and retrieved date.',
      acceptableVariations: [
        'If active ingredient or strength is unavailable, the row says unknown and avoids like-for-like ranking.',
        'A product detail drawer can provide the package evidence when the list row flags that details are required.'
      ],
      frictionSignals: [
        'A 10-pack and 30-pack are compared by shelf price only without pack-size context.',
        'Source or retrieved-at evidence is hidden behind unrelated product marketing.'
      ]
    },
    {
      id: 'sort-by-price-evidence',
      userAction: 'Sort or scan the pain-relief rows for the lowest visible price or comparable unit price.',
      expectedUiAffordance: 'The selected sort shows SEK price, comparable unit price when computable, source name, retrieved/observed timestamp, and confidence/freshness copy.',
      acceptableVariations: [
        'If unit price cannot be computed, rows show shelf price plus a blocked comparable-price reason.',
        'A source-backed table is acceptable when it clearly states it is not live stock or pharmacy-chain coverage.'
      ],
      frictionSignals: [
        'Missing prices look like free or cheapest products.',
        'The cheapest claim lacks source and freshness context.',
        'The UI ranks rows from different package sizes without explaining the comparable basis.'
      ]
    },
    {
      id: 'open-product-evidence',
      userAction: 'Open the best candidate and verify the underlying public evidence before deciding.',
      expectedUiAffordance: 'Product detail or evidence drawer repeats source URL, EAN or source identifier, retrieved date, price, package evidence, and OTC/no-medical-advice caveat.',
      acceptableVariations: [
        'A comparison drawer can substitute for product detail if it exposes the same evidence fields.',
        'If detail pages are unavailable, outbound source links remain visible from the list row.'
      ],
      frictionSignals: [
        'The final selection cannot be traced back to public source evidence.',
        'Detail copy adds stock, suitability, or medical claims not present in source evidence.'
      ]
    },
    {
      id: 'preserve-comparison-state',
      userAction: 'Save, share, or return to the filtered comparison without losing the pain-relief context.',
      expectedUiAffordance: 'A saved view, URL query, or local state preserves category/search, sort, and source-boundary caveats for the OTC pain-relief comparison.',
      acceptableVariations: [
        'If saving is unavailable, a copy-link action is acceptable when it preserves filters and sort.',
        'A disabled alert action is acceptable if it explains that live pharmacy price alerts need connector observations first.'
      ],
      frictionSignals: [
        'Back navigation loses the pain-relief filter or selected sort.',
        'Alert or save copy promises live pharmacy price drops without live source evidence.'
      ]
    }
  ] satisfies readonly PharmacyOtcPainReliefTaskStep[]
} as const;

export function runComparePharmacyOtcPainReliefSimulation(
  observations: readonly PharmacyOtcPainReliefStepObservation[] = []
): PharmacyOtcPainReliefPersonaRunLog[] {
  return personas.map((persona) => {
    const friction = comparePharmacyOtcPainReliefTask.steps.flatMap((step) => {
      const observation = observations.find((candidate) => candidate.personaId === persona.id && candidate.stepId === step.id);
      const entry = frictionForObservation(step, observation);
      return entry ? [entry] : [];
    });

    return {
      friction,
      personaId: persona.id,
      personaLabel: personaLabel(persona),
      taskId: comparePharmacyOtcPainReliefTask.id
    };
  });
}

export type ComparePharmacyOtcPainReliefTask = typeof comparePharmacyOtcPainReliefTask;
export type ComparePharmacyOtcPainReliefRunLog = ReturnType<typeof runComparePharmacyOtcPainReliefSimulation>;
