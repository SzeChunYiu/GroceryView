"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { nearestStoreFallbacks } from '@/lib/demo-data';

export type NearbyStoreFallback = {
  slug: string;
  name: string;
  distanceLabel: string;
};

type NearbyStoresWidgetState = 'loading' | 'permission-granted' | 'permission-denied' | 'unsupported' | 'error';

const STORE_FALLBACK_LIMIT = 3;
const DENIED_ERROR_CODE = 1;

export function getClosestStoreFallbacks(stores: NearbyStoreFallback[] = nearestStoreFallbacks) {
  return stores.slice(0, STORE_FALLBACK_LIMIT);
}

export function classifyGeolocationError(error: unknown): NearbyStoresWidgetState {
  if (!error) {
    return 'error';
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as { code?: number; message?: string };
    if (candidate.code === DENIED_ERROR_CODE) {
      return 'permission-denied';
    }
    if (typeof candidate.message === 'string' && candidate.message.toLowerCase().includes('permission')) {
      return 'permission-denied';
  }
  }

  return 'error';
}

export function deriveNearbyStoreState({
  geolocationSupported,
  permissionState,
  geolocationError,
  hasPosition
}: {
  geolocationSupported: boolean;
  permissionState?: PermissionState | null;
  geolocationError?: unknown;
  hasPosition?: boolean;
}) {
  if (!geolocationSupported) {
    return {
      state: 'unsupported' as const,
      title: 'Location unavailable',
      description: 'Fallback mode: distance metadata is shown from demo fixtures.',
      stores: getClosestStoreFallbacks()
    };
  }

  if (permissionState === 'denied') {
    return {
      state: 'permission-denied' as const,
      title: 'Location permission denied',
      description: 'Distance ranking requires location permission; using the closest-3 fallback list instead.',
      stores: getClosestStoreFallbacks()
    };
  }

  if (geolocationError) {
    const errorState = classifyGeolocationError(geolocationError);
    return {
      state: errorState,
      title: errorState === 'permission-denied' ? 'Location permission denied' : 'Location lookup failed',
      description:
        errorState === 'permission-denied'
          ? 'Distance ranking requires location permission; using the closest-3 fallback list instead.'
          : 'Could not resolve your current position in time. Using the closest-3 fallback list.',
      stores: getClosestStoreFallbacks()
    };
  }

  if (permissionState === 'granted' && hasPosition) {
    return {
      state: 'permission-granted' as const,
      title: 'Location enabled',
      description: 'Showing the nearest stores from your current position.',
      stores: []
    };
  }

  return {
    state: 'loading' as const,
    title: 'Requesting location',
    description: 'Asking for geolocation permission to rank nearby stores.',
    stores: []
  };
}

const FALLBACK_ERROR =
  'Location lookup failed. Using the closest-3 fallback list from demo fixtures to keep the page usable.';

function getFallbackMessage(state: NearbyStoresWidgetState) {
  if (state === 'unsupported') {
    return 'Location access is not available in this browser. Showing a fallback store list.';
  }
  if (state === 'permission-denied') {
    return 'Location permission was denied. Showing the closest-3 demo stores.';
  }
  if (state === 'error') {
    return FALLBACK_ERROR;
  }

  return 'Live nearby stores are loading.';
}

export function getStoreHref(slug: string) {
  return `/stores/${slug}`;
}

export function NearbyStoresWidget({
  stores = nearestStoreFallbacks,
  fallbackMessage
}: {
  stores?: NearbyStoreFallback[];
  fallbackMessage?: string;
}) {
  const [permissionState, setPermissionState] = useState<NearbyStoresWidgetState>('loading');
  const [permissionError, setPermissionError] = useState<unknown>(undefined);

  useEffect(() => {
    let active = true;

    async function resolveGeolocation() {
      if (typeof window === 'undefined' || !window.navigator.geolocation) {
        if (active) {
          setPermissionState('unsupported');
        }
        return;
      }

      try {
        if (window.navigator.permissions?.query) {
          const permission = await window.navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'denied') {
            if (active) {
              setPermissionState('permission-denied');
            }
            return;
          }
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          window.navigator.geolocation.getCurrentPosition(resolve, (error) => {
            reject(error);
          });
        });

        if (active) {
          if (position) {
            setPermissionState('permission-granted');
            return;
          }
          setPermissionState('error');
          setPermissionError(new Error('No coordinates available from the Geolocation API.'));
        }
      } catch (error) {
        if (active) {
          setPermissionState(classifyGeolocationError(error));
          setPermissionError(error);
        }
      }
    }

    void resolveGeolocation();

    return () => {
      active = false;
    };
  }, []);

  const state = deriveNearbyStoreState({
    geolocationSupported: typeof window !== 'undefined' && Boolean(window.navigator?.geolocation),
    geolocationError:
      permissionState === 'error' || permissionState === 'permission-denied' || permissionState === 'unsupported'
        ? permissionError
        : undefined,
    permissionState:
      permissionState === 'permission-granted'
        ? 'granted'
        : permissionState === 'permission-denied'
          ? 'denied'
          : undefined,
    hasPosition: permissionState === 'permission-granted'
  });

  return (
    <section className="rounded-lg border border-market-ink/10 bg-white p-4">
      <h2 className="mb-2 text-lg font-black">Nearby stores</h2>
      <p className="text-sm text-market-ink/60">{state.description}</p>

      {(state.state === 'permission-denied' || state.state === 'unsupported' || state.state === 'error') && (
        <>
          <p className="mt-2 text-sm font-semibold text-market-ink/75">
            {fallbackMessage ?? getFallbackMessage(state.state)}
          </p>
          <ul className="mt-3 grid gap-2" aria-label="closest stores fallback list">
            {state.stores.map((store) => (
              <li
                key={store.slug}
                className="rounded-md border border-market-ink/10 px-3 py-2 text-sm hover:border-market-mint"
              >
                <Link href={getStoreHref(store.slug)} className="font-black">
                  {store.name}
                </Link>
                <span className="ml-2 text-market-ink/55">{store.distanceLabel}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {state.state === 'permission-granted' && (
        <p className="mt-2 text-sm font-semibold text-market-ink/75">Location is enabled for live distance ranking.</p>
      )}

      {state.state === 'loading' && <p className="mt-2 text-sm text-market-ink/60">Checking device location settings...</p>}
    </section>
  );
}
