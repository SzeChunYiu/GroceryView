export type UxPersona = 'budget_parent' | 'senior_shopper' | 'newcomer_non_native' | 'mobile_power_user';

export type UxTaskStep = {
  id: string;
  instruction: string;
  expectedUiAffordance: string;
  acceptableVariations: string[];
  frictionLog: string;
};

export type UxTaskScript = {
  id: 'save-my-flyer-as-PDF';
  title: string;
  personas: UxPersona[];
  successCriteria: string[];
  steps: UxTaskStep[];
};

export const saveMyFlyerAsPdfTask: UxTaskScript = {
  id: 'save-my-flyer-as-PDF',
  title: 'Save my current flyer as a PDF',
  personas: ['budget_parent', 'senior_shopper', 'newcomer_non_native', 'mobile_power_user'],
  successCriteria: [
    'Persona can find the current flyer without using browser print shortcuts first.',
    'Persona can trigger a PDF save/download action from the flyer surface.',
    'Persona receives a clear completion state with file name, date, or download location.',
    'Simulator records any hesitation, dead end, missing label, or browser permission friction.'
  ],
  steps: [
    {
      id: 'open-flyers',
      instruction: 'Start at the GroceryView home page and navigate to current flyers or weekly offers.',
      expectedUiAffordance: 'A visible navigation item, card, or search result labelled Flyers, Weekly offers, Reklamblad, or Deals.',
      acceptableVariations: ['Deals page card links to flyers', 'Retailer page exposes a current flyer CTA', 'Search for “flyer” returns the flyer page'],
      frictionLog: 'Log label ambiguity, buried navigation, language mismatch, or more than two clicks before the flyer surface.'
    },
    {
      id: 'select-flyer',
      instruction: 'Choose the active flyer for the preferred retailer and confirm it is the current week.',
      expectedUiAffordance: 'A retailer flyer tile with retailer name, valid date range, and an open/view affordance.',
      acceptableVariations: ['Date range appears inside the viewer header', 'Only one active flyer opens automatically', 'Retailer filter preselects the nearest store'],
      frictionLog: 'Log missing validity dates, duplicate flyers, unclear store scope, or a tile that looks disabled.'
    },
    {
      id: 'find-save-pdf',
      instruction: 'Find the control for saving or exporting the flyer as a PDF.',
      expectedUiAffordance: 'A button or menu item labelled Save PDF, Download PDF, Export, Print, or Share with an explicit PDF option.',
      acceptableVariations: ['Overflow menu contains Download PDF', 'Print dialog defaults to Save as PDF', 'Share sheet includes Save to Files/PDF'],
      frictionLog: 'Log icon-only controls, browser-specific wording, hidden overflow menus, or controls below the fold.'
    },
    {
      id: 'confirm-download',
      instruction: 'Activate the PDF option and complete any browser or OS download confirmation.',
      expectedUiAffordance: 'A download prompt, save location picker, toast, or browser download shelf showing a .pdf file.',
      acceptableVariations: ['PDF opens in a new tab with a download icon', 'Mobile share sheet saves to Files', 'Desktop print dialog completes Save as PDF'],
      frictionLog: 'Log blocked popups, unclear file names, missing extension, permission prompts, or forced sign-in.'
    },
    {
      id: 'verify-saved-file',
      instruction: 'Verify the saved PDF is the same retailer flyer and can be reopened.',
      expectedUiAffordance: 'A visible file name or confirmation that includes retailer and flyer week/date.',
      acceptableVariations: ['Browser downloads list shows the file', 'OS file picker shows the saved PDF', 'In-app toast offers Open downloaded PDF'],
      frictionLog: 'Log if the PDF is blank, wrong retailer, stale week, image-only without pages, or not reachable after save.'
    }
  ]
};

export default saveMyFlyerAsPdfTask;
