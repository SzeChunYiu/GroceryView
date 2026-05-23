'use client';

import { useCallback, useEffect, useState } from 'react';

type GeolocationHookStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported' | 'error';

type Coordinates = {
  latitude: number;
  longitude: number;
};

export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationHookStatus>('idle');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setStatus('requesting');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setStatus('error');
          setError('Location report did not include numeric coordinates.');
          setCoords(null);
          return;
        }

        setCoords({ latitude, longitude });
        setStatus('granted');
      },
      (geoError) => {
        setCoords(null);
        if (geoError.code === 1) {
          setStatus('denied');
          setError('Location permission was denied.');
          return;
        }
        setStatus('error');
        setError(geoError.message || 'Could not read your current location.');
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 300000
      }
    );
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      setError('Geolocation is not supported in this browser.');
      return;
    }

    void (async () => {
      const permissions = navigator.permissions;
      if (!permissions || !permissions.query) {
        return;
      }

      try {
        const permission = await permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          requestLocation();
        }
        if (permission.state === 'denied') {
          setStatus('denied');
          setError('Location permission is blocked.');
        }
      } catch {
        // Permission API is optional in some browsers; ignore and wait for a manual request.
      }
    })();
  }, [requestLocation]);

  return { status, coords, error, requestLocation };
}
