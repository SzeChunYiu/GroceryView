'use client';

import { useCallback, useMemo, useState } from 'react';

type GeolocationErrorKind = 'permission-denied' | 'timeout' | 'unsupported' | 'unavailable';

type GeolocationErrorState = {
  kind: GeolocationErrorKind;
  message: string;
};

type GeolocationPositionState = {
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
  const [position, setPosition] = useState<GeolocationPositionState | null>(null);

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

  const retryGuidance = useMemo(() => (error ? buildRetryGuidance(error.kind, attempts) : null), [attempts, error]);

  return { attempts, error, isLoading, position, requestLocation, retryGuidance };
}
