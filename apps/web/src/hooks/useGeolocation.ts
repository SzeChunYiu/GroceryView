'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { activeShoppingLists, activeShoppingTripEstimates, consentedTripOrigin, estimateTripCompletion } from '@/lib/trip-planner';

type GeolocationErrorKind = 'permission-denied' | 'timeout' | 'unsupported' | 'unavailable';

type GeolocationErrorState = {
  kind: GeolocationErrorKind;
  message: string;
};

export type GeolocationPositionState = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

function mapPositionError(error: GeolocationPositionError): GeolocationErrorState {
  if (error.code === error.PERMISSION_DENIED) {
    return { kind: 'permission-denied', message: 'Location permission was denied.' };
  }

  if (error.code === error.TIMEOUT) {
    return { kind: 'timeout', message: 'Location lookup timed out.' };
  }

  return { kind: 'unavailable', message: 'Your current location is unavailable.' };
}

function buildRetryGuidance(kind: GeolocationErrorKind, attempts: number) {
  const repeatedPrefix = attempts > 1 ? 'This keeps failing. ' : '';

  if (kind === 'permission-denied') {
    return `${repeatedPrefix}Allow location access in your browser settings, then retry. You can still search by city or choose a store manually.`;
  }

  if (kind === 'timeout') {
    return `${repeatedPrefix}Move near a window, disable VPN/location blockers, or try again on a stronger connection.`;
  }

  if (kind === 'unsupported') {
    return 'This browser does not support geolocation. Search by city or enter a postcode instead.';
  }

  return `${repeatedPrefix}Retry in a moment, or use city search while location services recover.`;
}

export function useGeolocation() {
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<GeolocationErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [position, setPosition] = useState<GeolocationPositionState | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const requestLocation = useCallback(() => {
    setAttempts((currentAttempts) => currentAttempts + 1);
    setIsLoading(true);
    setError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsLoading(false);
      setError({ kind: 'unsupported', message: 'Geolocation is not supported in this browser.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (result) => {
        setIsLoading(false);
        setPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy
        });
      },
      (nextError) => {
        setIsLoading(false);
        setError(mapPositionError(nextError));
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }
    );
  }, []);

  const stopWatchingLocation = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setIsWatching(false);
    setIsLoading(false);
  }, []);

  const startWatchingLocation = useCallback(() => {
    setAttempts((currentAttempts) => currentAttempts + 1);
    setIsLoading(true);
    setError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsLoading(false);
      setIsWatching(false);
      setError({ kind: 'unsupported', message: 'Geolocation is not supported in this browser.' });
      return;
    }

    stopWatchingLocation();
    setIsLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (result) => {
        setIsLoading(false);
        setIsWatching(true);
        setPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy
        });
      },
      (nextError) => {
        setIsLoading(false);
        setIsWatching(false);
        setError(mapPositionError(nextError));
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 12_000 }
    );
  }, [stopWatchingLocation]);

  useEffect(() => stopWatchingLocation, [stopWatchingLocation]);

  const retryGuidance = useMemo(() => (error ? buildRetryGuidance(error.kind, attempts) : null), [attempts, error]);

  return { attempts, error, isLoading, isWatching, position, requestLocation, retryGuidance, startWatchingLocation, stopWatchingLocation };
}

function hasSignedInSession() {
  try {
    return Boolean(window.sessionStorage.getItem('groceryview:accessToken') || window.sessionStorage.getItem('groceryview:userId'));
  } catch {
    return false;
  }
}

export function ConsentedShoppingTripPlanner() {
  const { error, isLoading, isWatching, position, retryGuidance, startWatchingLocation, stopWatchingLocation } = useGeolocation();
  const [consentStatus, setConsentStatus] = useState('Public snapshot is active. Sign in and opt in before GroceryView reads browser location.');
  const origin = useMemo(
    () => position ? consentedTripOrigin(position.latitude, position.longitude, position.accuracy) : null,
    [position]
  );
  const estimates = useMemo(
    () => origin ? activeShoppingLists.map((list) => estimateTripCompletion(list, list.routeMode, origin)) : activeShoppingTripEstimates,
    [origin]
  );

  function startConsentedRouting() {
    if (!hasSignedInSession()) {
      setConsentStatus('Fail-closed: sign in before private location can replace the public route snapshot.');
      return;
    }

    setConsentStatus('Consent recorded for this browser session. Watching location and recalculating route estimates when it changes.');
    startWatchingLocation();
  }

  return (
    <section className="mt-6 rounded-3xl border border-indigo-200 bg-white p-5 shadow-sm" aria-label="Consented shopping trip geolocation planner">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-800">Consented geolocation</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Recalculate trips from browser location</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">{consentStatus}</p>
          {position ? (
            <p className="mt-2 text-xs font-bold text-indigo-900">
              Recalculated from {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)} within {Math.round(position.accuracy)} m accuracy.
            </p>
          ) : null}
          {error ? (
            <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-950">{error.message} {retryGuidance}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-indigo-900 px-4 py-2 text-sm font-black text-white disabled:opacity-60" disabled={isLoading} onClick={startConsentedRouting} type="button">
            {isLoading ? 'Checking location…' : isWatching ? 'Update live route' : 'Use signed-in location'}
          </button>
          {isWatching ? (
            <button className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-800" onClick={stopWatchingLocation} type="button">
              Stop location watch
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {estimates.map((estimate) => (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4" key={estimate.listId}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">{estimate.originSource === 'consented_geolocation' ? 'Live route' : 'Public snapshot'}</p>
            <h3 className="mt-2 text-lg font-black text-slate-950">{estimate.listName}</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-600">origin approach</dt>
                <dd className="font-black text-slate-950">{estimate.originApproachMinutes} min</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-slate-600">distance to store</dt>
                <dd className="font-black text-slate-950">{(estimate.originDistanceMeters / 1000).toFixed(1)} km</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-indigo-100 pt-2">
                <dt className="font-black text-slate-950">recalculated total</dt>
                <dd className="font-black text-indigo-900">{estimate.timeToCompleteMinutes} min</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs font-semibold leading-5 text-indigo-900">{estimate.originLabel}</p>
            {estimate.routeRecalculatedAt ? <p className="mt-1 text-xs font-semibold text-slate-500">Updated {estimate.routeRecalculatedAt}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
