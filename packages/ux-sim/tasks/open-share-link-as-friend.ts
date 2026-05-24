export type UxTaskStep = {
  id: string;
  instruction: string;
  expectedAffordance: string;
  acceptableVariations: string[];
  frictionSignals: string[];
};

export type UxTaskScript = {
  id: 'open-share-link-as-friend';
  title: string;
  personaCoverage: 'all';
  startState: string;
  successCriteria: string[];
  steps: UxTaskStep[];
  frictionLogFields: string[];
};

export const openShareLinkAsFriendTask: UxTaskScript = {
  id: 'open-share-link-as-friend',
  title: 'Open a shared GroceryView list as an invited friend',
  personaCoverage: 'all',
  startState: 'Persona receives a GroceryView share URL from a friend outside the current app session.',
  successCriteria: [
    'The shared list opens without requiring the friend to edit the owner account.',
    'The viewer can identify who shared the list and when it was last updated.',
    'The viewer can inspect items, prices, and store context in read-only mode.',
    'The viewer understands the next action: sign in, save a copy, or continue as guest.'
  ],
  steps: [
    {
      id: 'open-link',
      instruction: 'Open the received share URL in a fresh browser session or mobile webview.',
      expectedAffordance: 'The URL resolves to a GroceryView shared-list landing state with a visible loading or list surface.',
      acceptableVariations: [
        'A short interstitial appears before the list if it explains the friend/shared context.',
        'A sign-in prompt may appear only if guest access is unavailable and the reason is explicit.',
        'Expired or revoked links may show a specific expired/revoked state instead of a generic error.'
      ],
      frictionSignals: ['blank_page', 'generic_404', 'login_wall_without_reason', 'untrusted_link_warning']
    },
    {
      id: 'recognize-shared-context',
      instruction: 'Confirm this is a friend view rather than the owner editing view.',
      expectedAffordance: 'The page names the list owner or sharing context and marks the viewer as a guest/friend/read-only participant.',
      acceptableVariations: [
        'Owner identity may be first name, display name, household name, or masked email.',
        'Read-only status may be conveyed by disabled edit controls plus helper text.',
        'Collaborative lists may show a request-access affordance if direct editing is not granted.'
      ],
      frictionSignals: ['owner_context_missing', 'edit_controls_look_enabled', 'friend_role_unclear']
    },
    {
      id: 'inspect-list-items',
      instruction: 'Scan the shared grocery items and open details for at least one item.',
      expectedAffordance: 'Items, quantities, price context, and store/source labels are visible without destructive actions.',
      acceptableVariations: [
        'Details may open inline, in a drawer, or on a product page.',
        'Unavailable prices may show explicit missing-data copy.',
        'Mobile layouts may collapse store/source metadata behind an info icon.'
      ],
      frictionSignals: ['item_rows_not_visible', 'price_source_hidden', 'tap_target_too_small', 'unexpected_edit_prompt']
    },
    {
      id: 'try-save-or-join',
      instruction: 'Look for the natural next action to keep the list, join the household, or save a copy.',
      expectedAffordance: 'A primary action clearly explains whether it signs in, saves a personal copy, or requests collaboration access.',
      acceptableVariations: [
        'Guest users may be asked to sign in after choosing save/copy.',
        'Existing users may see one-tap save to account.',
        'If collaboration is disabled, the UI may offer copy-only with a short explanation.'
      ],
      frictionSignals: ['primary_action_ambiguous', 'unexpected_account_creation', 'copy_vs_join_unclear']
    },
    {
      id: 'exit-without-mutating-owner-list',
      instruction: 'Back out or close the shared list without making owner-list changes.',
      expectedAffordance: 'Leaving the view does not mutate the owner list and any unsaved guest choices are clearly discarded or saved as a copy.',
      acceptableVariations: [
        'A confirmation may appear only if the friend created a personal copy or draft.',
        'Browser back may return to the referring chat/mail/webview.',
        'Installed app deep links may return to the app home after closing.'
      ],
      frictionSignals: ['owner_list_mutated', 'unsaved_state_confusing', 'back_navigation_trap']
    }
  ],
  frictionLogFields: [
    'persona_id',
    'device_class',
    'entry_surface',
    'step_id',
    'friction_signal',
    'observed_copy',
    'screenshot_ref',
    'time_to_recover_ms'
  ]
};

export default openShareLinkAsFriendTask;
