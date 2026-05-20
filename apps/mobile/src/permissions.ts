export type MobilePermissionKind = 'camera' | 'notifications';

export type MobilePermissionState = 'granted' | 'not_determined' | 'denied' | 'blocked' | 'unavailable';

export type MobilePermissionSurface = '/scan/barcode' | '/scan/receipt' | '/profile/notifications-placeholder';

export type MobilePermissionSnapshot = {
  camera: MobilePermissionState;
  notifications: MobilePermissionState;
};

export type MobilePermissionPrompt = {
  permission: MobilePermissionKind;
  surface: MobilePermissionSurface;
  status: 'ready' | 'request_permission' | 'open_settings' | 'unavailable';
  reason: string;
  blocksPrimaryAction: boolean;
  retryable: boolean;
};

export type MobilePermissionPlan = {
  status: 'ready' | 'needs_permission' | 'blocked';
  prompts: MobilePermissionPrompt[];
  readySurfaces: MobilePermissionSurface[];
  blockedSurfaces: MobilePermissionSurface[];
};

const surfacePermissions: Array<{ surface: MobilePermissionSurface; permission: MobilePermissionKind; action: string }> = [
  { surface: '/scan/barcode', permission: 'camera', action: 'scan barcode' },
  { surface: '/scan/receipt', permission: 'camera', action: 'scan receipt' },
  { surface: '/profile/notifications-placeholder', permission: 'notifications', action: 'send price alerts' }
];

function promptFor(surface: MobilePermissionSurface, permission: MobilePermissionKind, state: MobilePermissionState, action: string): MobilePermissionPrompt {
  if (state === 'granted') {
    return {
      permission,
      surface,
      status: 'ready',
      reason: `${permission} permission is granted.`,
      blocksPrimaryAction: false,
      retryable: false
    };
  }

  if (state === 'not_determined') {
    return {
      permission,
      surface,
      status: 'request_permission',
      reason: `Request ${permission} permission before ${action}.`,
      blocksPrimaryAction: true,
      retryable: true
    };
  }

  if (state === 'unavailable') {
    return {
      permission,
      surface,
      status: 'unavailable',
      reason: `${permission} is unavailable on this device.`,
      blocksPrimaryAction: true,
      retryable: false
    };
  }

  return {
    permission,
    surface,
    status: 'open_settings',
    reason: `${permission} permission is ${state}; route the user to system settings before ${action}.`,
    blocksPrimaryAction: true,
    retryable: state === 'denied'
  };
}

export function buildMobilePermissionPlan(snapshot: MobilePermissionSnapshot): MobilePermissionPlan {
  const prompts = surfacePermissions.map((surface) => promptFor(surface.surface, surface.permission, snapshot[surface.permission], surface.action));
  const readySurfaces = prompts.filter((prompt) => prompt.status === 'ready').map((prompt) => prompt.surface);
  const blockedSurfaces = prompts.filter((prompt) => prompt.blocksPrimaryAction).map((prompt) => prompt.surface);
  const hasBlocked = prompts.some((prompt) => prompt.status === 'open_settings' || prompt.status === 'unavailable');

  return {
    status: blockedSurfaces.length === 0 ? 'ready' : hasBlocked ? 'blocked' : 'needs_permission',
    prompts,
    readySurfaces,
    blockedSurfaces
  };
}

export function nextMobilePermissionPrompt(plan: MobilePermissionPlan): MobilePermissionPrompt | null {
  return plan.prompts.find((prompt) => prompt.status !== 'ready') ?? null;
}

export function summarizeMobilePermissionPlan(plan: MobilePermissionPlan): Record<MobilePermissionPrompt['status'], number> {
  return plan.prompts.reduce<Record<MobilePermissionPrompt['status'], number>>(
    (summary, prompt) => ({ ...summary, [prompt.status]: summary[prompt.status] + 1 }),
    { ready: 0, request_permission: 0, open_settings: 0, unavailable: 0 }
  );
}
