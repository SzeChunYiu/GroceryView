import type { FamilyRole } from './use-list';

export type ListPresenceState = 'viewing' | 'editing' | 'idle';

export type ListPresenceParticipant = {
  id: string;
  displayName: string;
  role: FamilyRole;
  state: ListPresenceState;
  activeItemId?: string;
  lastSeenAt: string;
  colorClassName: string;
};

export type ListPresenceSummary = {
  activeCount: number;
  editingCount: number;
  viewingCount: number;
  idleCount: number;
  statusLabel: string;
};

export const listPresenceParticipants: ListPresenceParticipant[] = [
  {
    id: 'presence-guardian',
    displayName: 'Maya',
    role: 'guardian',
    state: 'editing',
    activeItemId: 'oat-milk',
    lastSeenAt: '2026-05-25T15:15:00.000Z',
    colorClassName: 'bg-emerald-700 text-white'
  },
  {
    id: 'presence-partner',
    displayName: 'Jon',
    role: 'partner',
    state: 'viewing',
    activeItemId: 'pasta-sauce',
    lastSeenAt: '2026-05-25T15:14:00.000Z',
    colorClassName: 'bg-sky-700 text-white'
  },
  {
    id: 'presence-teen',
    displayName: 'Eli',
    role: 'teen',
    state: 'idle',
    lastSeenAt: '2026-05-25T15:04:00.000Z',
    colorClassName: 'bg-violet-700 text-white'
  }
];

export function summarizeListPresence(participants: readonly ListPresenceParticipant[]): ListPresenceSummary {
  const editingCount = participants.filter((participant) => participant.state === 'editing').length;
  const viewingCount = participants.filter((participant) => participant.state === 'viewing').length;
  const idleCount = participants.filter((participant) => participant.state === 'idle').length;
  const activeCount = editingCount + viewingCount;

  return {
    activeCount,
    editingCount,
    viewingCount,
    idleCount,
    statusLabel: activeCount === 0
      ? 'No active collaborators'
      : `${activeCount} active · ${editingCount} editing · ${viewingCount} viewing`
  };
}

export function participantsForListItem(
  participants: readonly ListPresenceParticipant[],
  itemId: string
): ListPresenceParticipant[] {
  return participants.filter((participant) => participant.activeItemId === itemId && participant.state !== 'idle');
}

export function listPresenceStateLabel(state: ListPresenceState): string {
  if (state === 'editing') return 'Editing';
  if (state === 'viewing') return 'Viewing';
  return 'Idle';
}

export function formatPresenceLastSeen(lastSeenAt: string): string {
  const parsed = Date.parse(lastSeenAt);
  if (!Number.isFinite(parsed)) return 'last seen time unknown';
  return `last seen ${lastSeenAt.replace('T', ' ').slice(0, 16)}`;
}
