'use client';

import { useCallback, useMemo, useState } from 'react';

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

export type TripPlannerOrigin = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  label: string;
  consented: boolean;
};

type GeolocationRequestOptions = {
  enableHighAccuracy?: boolean;
  maximumAgeMs?: number;
  timeoutMs?: number;
};

const defaultRequestOptions = {
  enableHighAccuracy: true,
  maximumAgeMs: 60_000,
  timeoutMs: 10_000
};
const emptyRequestOptions: GeolocationRequestOptions = {};

export function buildTripPlannerOrigin(position: GeolocationPositionState | null): TripPlannerOrigin | null {
  if (!position) {
    return null;
  }

  return {
    latitude: position.latitude,
    longitude: position.longitude,
    accuracyMeters: Math.ceil(position.accuracy),
    label: `Current location within ${Math.ceil(position.accuracy)} m`,
    consented: true
  };
}

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

export function useGeolocation(options: GeolocationRequestOptions = emptyRequestOptions) {
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<GeolocationErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<GeolocationPositionState | null>(null);
  const requestOptions = useMemo(
    () => ({ ...defaultRequestOptions, ...options }),
    [options.enableHighAccuracy, options.maximumAgeMs, options.timeoutMs]
  );

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
      {
        enableHighAccuracy: requestOptions.enableHighAccuracy,
        maximumAge: requestOptions.maximumAgeMs,
        timeout: requestOptions.timeoutMs
      }
    );
  }, [requestOptions]);

  const retryGuidance = useMemo(() => (error ? buildRetryGuidance(error.kind, attempts) : null), [attempts, error]);
  const tripPlannerOrigin = useMemo(() => buildTripPlannerOrigin(position), [position]);

  return { attempts, error, isLoading, position, requestLocation, retryGuidance, tripPlannerOrigin };
}
