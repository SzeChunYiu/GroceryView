'use client';

import { useCallback, useEffect, useState } from 'react';

type GeolocationStatus =
  | 'idle'
  | 'prompting'
  | 'success'
  | 'permission-denied'
  | 'unsupported'
  | 'error';

export type UseGeolocationResult = {
  accuracy: number | null;
  error: GeolocationErrorState | null;
  isLoading: boolean;
  latitude: number | null;
  longitude: number | null;
  requestLocation: () => void;
  status: GeolocationStatus;
};

export type GeolocationErrorState = {
  code: GeolocationPositionError['code'];
  message: string;
};

type GeolocationOptions = {
  autoRequest?: boolean;
  timeoutMs?: number;
  maximumAgeMs?: number;
  enableHighAccuracy?: boolean;
};

function errorMessageForError(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return 'Location permission was denied.';
  if (error.code === error.POSITION_UNAVAILABLE) return 'Could not determine location right now.';
  if (error.code === error.TIMEOUT) return 'Location lookup timed out.';
  return `Location lookup failed (${error.message})`;
}

export function useGeolocation({
  autoRequest = false,
  enableHighAccuracy = false,
  timeoutMs = 12_000,
  maximumAgeMs = 60_000
}: GeolocationOptions = {}): UseGeolocationResult {
  const isGeolocationSupported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);

  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<GeolocationErrorState | null>(null);

  const requestLocation = useCallback(() => {
    if (!isGeolocationSupported) {
      setStatus('unsupported');
      return;
    }

    setStatus('prompting');
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: timeoutMs,
      maximumAge: maximumAgeMs
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setAccuracy(position.coords.accuracy);
        setError(null);
        setStatus('success');
      },
      (positionError) => {
        const errorState = {
          code: positionError.code,
          message: errorMessageForError(positionError)
        };

        setError(errorState);
        setLatitude(null);
        setLongitude(null);
        setAccuracy(null);

        if (positionError.code === positionError.PERMISSION_DENIED) {
          setStatus('permission-denied');
        } else {
          setStatus('error');
        }
      },
      options
    );
  }, [enableHighAccuracy, isGeolocationSupported, maximumAgeMs, timeoutMs]);

  useEffect(() => {
    if (!autoRequest) return;
    requestLocation();
  }, [autoRequest, requestLocation]);

  return {
    accuracy,
    error,
    isLoading: status === 'prompting',
    latitude,
    longitude,
    requestLocation,
    status: isGeolocationSupported ? status : 'unsupported'
  };
}
