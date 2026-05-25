import { allergySuffererPersona } from '../personas/allergy-sufferer.js';
import ecoConsciousPersona from '../personas/eco-conscious.js';
import { restaurantOwnerPersona } from '../personas/restaurant-owner.js';
import { studentPersona } from '../personas/student.js';

const personas = [studentPersona, allergySuffererPersona, ecoConsciousPersona, restaurantOwnerPersona] as const;

type Persona = (typeof personas)[number];

export type SaveMyFlyerAsPdfTaskStep = {
  acceptableVariations: readonly string[];
  expectedUiAffordance: string;
  frictionSignals: readonly string[];
  id: string;
  userAction: string;
};

export type SaveMyFlyerAsPdfStepObservation = {
  acceptableVariationUsed?: string;
  affordanceFound: boolean;
  notes?: string;
  personaId: string;
  stepId: string;
};

export type SaveMyFlyerAsPdfFrictionEntry = {
  acceptableVariationUsed?: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  stepId: string;
};

export type SaveMyFlyerAsPdfPersonaRunLog = {
  friction: SaveMyFlyerAsPdfFrictionEntry[];
  personaId: string;
  personaLabel: string;
  taskId: 'save-my-flyer-as-PDF';
};

function personaLabel(persona: Persona) {
  if ('label' in persona) return persona.label;
  return persona.name;
}

function frictionForObservation(
  step: SaveMyFlyerAsPdfTaskStep,
  observation: SaveMyFlyerAsPdfStepObservation | undefined
): SaveMyFlyerAsPdfFrictionEntry | null {
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

export const saveMyFlyerAsPdfTask = {
  id: 'save-my-flyer-as-PDF',
  label: 'Save MyFlyer as a PDF',
  entryPage: '/stockholm/my-flyer',
  personas: personas.map((persona) => persona.id),
  guardrails: [
    'Printable flyer rows must remain backed by visible product, chain, offer, and source identifiers.',
    'Saving as PDF must use the browser print flow; do not invent a server-generated PDF artifact.',
    'Screen-only controls, advertising, navigation, and notification prompts must be hidden from the printable output.'
  ],
  steps: [
    {
      id: 'open-my-flyer',
      userAction: 'Open the city MyFlyer page from navigation, search, or a direct shared link.',
      expectedUiAffordance: 'A MyFlyer page headed with the city name, generated date, offer count, and print-ready flyer copy.',
      acceptableVariations: [
        'A localized city route such as /lund/my-flyer or /stockholm/my-flyer is acceptable.',
        'A signed-in prompt may appear if it stays screen-only and does not block viewing the flyer.',
        'A direct URL is acceptable when navigation to MyFlyer is not yet exposed.'
      ],
      frictionSignals: [
        'The user cannot tell they are on a printable MyFlyer surface.',
        'Generated date or offer count is missing before printing.'
      ]
    },
    {
      id: 'verify-source-backed-offers',
      userAction: 'Scan several flyer cards before printing to ensure the PDF will contain trustworthy deals.',
      expectedUiAffordance: 'Each visible offer card shows product name, brand, chain/store, price or unit, and an observed catalogue/source identifier.',
      acceptableVariations: [
        'A compact print preview summary can substitute if it still exposes source identifiers.',
        'Diet or ranking controls may reorder cards only when the source-backed offer data remains visible.',
        'Rows with missing live evidence may be omitted instead of shown as estimated deals.'
      ],
      frictionSignals: [
        'Offer cards hide source or chain information.',
        'The flyer appears to include sample, sponsored, or estimated rows without evidence.',
        'Controls change the printable order without preserving source-backed prices.'
      ]
    },
    {
      id: 'start-print-flow',
      userAction: 'Activate the print action for the flyer.',
      expectedUiAffordance: 'A visible Print flyer button or browser print shortcut opens the print dialog for the MyFlyer page.',
      acceptableVariations: [
        'Keyboard shortcut Ctrl/Cmd+P is acceptable when the page has clear print styling.',
        'A browser menu print action is acceptable if the output still targets the flyer page.',
        'A print icon can substitute for button text when it has an accessible label.'
      ],
      frictionSignals: [
        'Print action is hidden behind unrelated share or notification controls.',
        'The button does not trigger the browser print dialog.',
        'The print flow targets the whole app shell instead of the flyer content.'
      ]
    },
    {
      id: 'choose-save-as-pdf',
      userAction: 'In the system print dialog, choose Save as PDF or the platform PDF destination.',
      expectedUiAffordance: 'The print dialog exposes a PDF destination, save control, or OS-level PDF menu without requiring GroceryView credentials.',
      acceptableVariations: [
        'Chrome/Edge Save to PDF, Safari PDF menu, Firefox Print to File, or OS print-to-PDF are all acceptable.',
        'If the simulator cannot inspect native dialogs, a recorded handoff to the browser PDF destination is acceptable.',
        'Mobile share-to-PDF is acceptable when it preserves the same print stylesheet.'
      ],
      frictionSignals: [
        'The app presents a fake download that is not generated by the print flow.',
        'Saving requires sign-in even though printing the visible flyer should not.',
        'The native dialog cannot select a PDF destination.'
      ]
    },
    {
      id: 'confirm-print-preview-content',
      userAction: 'Review the preview before saving.',
      expectedUiAffordance: 'Preview shows the two-column flyer, enlarged product images, prices, source identifiers, and hides nav, ads, controls, and notification prompts.',
      acceptableVariations: [
        'One-column mobile PDF is acceptable if source-backed offer details remain visible.',
        'Browser headers and footers may be present when the flyer content is not obscured.',
        'Diet filter summary may appear if it is explicitly part of the printable flyer context.'
      ],
      frictionSignals: [
        'Navigation, ads, ranker controls, or push prompts appear in the PDF output.',
        'Product images or prices are clipped.',
        'Source identifiers disappear from print preview.'
      ]
    },
    {
      id: 'save-file-with-readable-name',
      userAction: 'Save the PDF file and choose a recognizable filename.',
      expectedUiAffordance: 'The save dialog suggests or accepts a filename that includes GroceryView, MyFlyer, city, or date context.',
      acceptableVariations: [
        'Browser default filename is acceptable when it contains the route or page title.',
        'User-provided filename is acceptable when the save action succeeds.',
        'Simulator filesystem logging can substitute for native save completion.'
      ],
      frictionSignals: [
        'Default filename is blank or unrelated to MyFlyer.',
        'The save location or completion state is unclear.',
        'Saving fails without a recoverable error.'
      ]
    },
    {
      id: 'verify-saved-pdf',
      userAction: 'Open or inspect the saved PDF enough to confirm it is usable for a shopping trip.',
      expectedUiAffordance: 'The saved PDF retains readable deal cards, source-backed prices, and the printable note about hidden navigation or advertising.',
      acceptableVariations: [
        'A simulator screenshot or PDF metadata record is acceptable when full native file opening is unavailable.',
        'A printed paper preview is acceptable if the same content checks pass.',
        'A download shelf or file picker confirmation can count when it links to the saved PDF.'
      ],
      frictionSignals: [
        'Saved PDF is blank, clipped, or unreadable.',
        'Offer evidence differs from the on-page flyer.',
        'The user cannot find or reopen the saved file.'
      ]
    }
  ] satisfies readonly SaveMyFlyerAsPdfTaskStep[]
} as const;

export function runSaveMyFlyerAsPdfSimulation(
  observations: readonly SaveMyFlyerAsPdfStepObservation[] = []
): SaveMyFlyerAsPdfPersonaRunLog[] {
  return personas.map((persona) => {
    const friction = saveMyFlyerAsPdfTask.steps.flatMap((step) => {
      const observation = observations.find((candidate) => candidate.personaId === persona.id && candidate.stepId === step.id);
      const entry = frictionForObservation(step, observation);
      return entry ? [entry] : [];
    });

    return {
      friction,
      personaId: persona.id,
      personaLabel: personaLabel(persona),
      taskId: saveMyFlyerAsPdfTask.id
    };
  });
}

export type SaveMyFlyerAsPdfTask = typeof saveMyFlyerAsPdfTask;
export type SaveMyFlyerAsPdfRunLog = ReturnType<typeof runSaveMyFlyerAsPdfSimulation>;
