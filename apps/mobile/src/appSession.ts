import type { MobileOfflineMutation } from './offlineMutations.js';
import { selectMobileMutationsForSync, summarizeMobileOfflineMutations } from './offlineMutations.js';
import type { MobilePermissionSnapshot, MobilePermissionSurface } from './permissions.js';
import { buildMobilePermissionPlan, nextMobilePermissionPrompt } from './permissions.js';
import { buildMobilePersistedCachePlan, type MobileQueryId } from './queryCache.js';
import { buildMobileRouteManifest, type MobileMvpRoutePath } from './routeManifest.js';

export type MobileConnectivityState = 'online' | 'offline' | 'metered';

export type MobileAppSessionInput = {
  userId: string;
  now: string;
  connectivity: MobileConnectivityState;
  permissions: MobilePermissionSnapshot;
  offlineQueue: MobileOfflineMutation[];
};

export type MobileAppSessionPlan = {
  userId: string;
  initialRoute: MobileMvpRoutePath;
  cache: {
    storageKey: string;
    partitionKey: string;
    hydrateOrder: MobileQueryId[];
    persistedQueryIds: MobileQueryId[];
  };
  routes: {
    required: MobileMvpRoutePath[];
    placeholders: MobileMvpRoutePath[];
  };
  offline: {
    canSyncNow: boolean;
    readyMutationIds: string[];
    pendingCount: number;
    failedCount: number;
    sensitiveLocalOnlyCount: number;
  };
  permissions: {
    status: ReturnType<typeof buildMobilePermissionPlan>['status'];
    nextPromptSurface: MobilePermissionSurface | null;
    blockedSurfaces: ReturnType<typeof buildMobilePermissionPlan>['blockedSurfaces'];
  };
};

function requireNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function requireIsoDate(value: string, label: string): string {
  if (Number.isNaN(Date.parse(value))) throw new Error(`${label} must be an ISO date.`);
  return value;
}

export function buildMobileAppSessionPlan(input: MobileAppSessionInput): MobileAppSessionPlan {
  const userId = requireNonEmpty(input.userId, 'userId');
  requireIsoDate(input.now, 'now');

  const manifest = buildMobileRouteManifest();
  const cachePlan = buildMobilePersistedCachePlan(userId);
  const offlineSummary = summarizeMobileOfflineMutations(input.offlineQueue, input.now);
  const readyMutations = input.connectivity === 'offline' ? [] : selectMobileMutationsForSync(input.offlineQueue, { now: input.now, limit: 10 });
  const permissionPlan = buildMobilePermissionPlan(input.permissions);
  const nextPrompt = nextMobilePermissionPrompt(permissionPlan);

  return {
    userId,
    initialRoute: manifest.initialRoute,
    cache: {
      storageKey: cachePlan.storageKey,
      partitionKey: cachePlan.userPartitionKey,
      hydrateOrder: [...cachePlan.hydrateOrder],
      persistedQueryIds: [...cachePlan.persistedQueryIds]
    },
    routes: {
      required: manifest.requiredRoutes.map((route) => route.path),
      placeholders: manifest.placeholderRoutes.map((route) => route.path)
    },
    offline: {
      canSyncNow: input.connectivity !== 'offline' && readyMutations.length > 0,
      readyMutationIds: readyMutations.map((mutation) => mutation.id),
      pendingCount: offlineSummary.pending,
      failedCount: offlineSummary.failed,
      sensitiveLocalOnlyCount: offlineSummary.sensitiveLocalOnly
    },
    permissions: {
      status: permissionPlan.status,
      nextPromptSurface: nextPrompt?.surface ?? null,
      blockedSurfaces: [...permissionPlan.blockedSurfaces]
    }
  };
}
