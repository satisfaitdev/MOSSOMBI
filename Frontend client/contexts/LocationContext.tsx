import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { permissionService } from '@/services/permissionService';
import { useAuth } from '@/contexts/AuthContext';

interface LocationState {
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  error: string | null;
}

interface LocationContextType {
  location: LocationState;
  detectCity: () => Promise<void>;
  setCity: (city: string | null) => Promise<void>;
  clearLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | null>(null);

const STORAGE_KEY = 'device_location';

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<LocationState>({
    city: null,
    country: null,
    latitude: null,
    longitude: null,
    isLoading: true,
    error: null,
  });

  const [hasAttemptedThisSession, setHasAttemptedThisSession] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setState((prev) => ({
            ...prev,
            city: parsed?.city ?? null,
            country: parsed?.country ?? null,
            latitude: typeof parsed?.latitude === 'number' ? parsed.latitude : null,
            longitude: typeof parsed?.longitude === 'number' ? parsed.longitude : null,
            isLoading: false,
          }));
          return;
        }
      } catch {
        // ignore
      }

      setState((prev) => ({ ...prev, isLoading: false }));
    })();
  }, []);

  // Auto-detect city after login if missing (1x per session)
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setHasAttemptedThisSession(false);
      return;
    }
    if (state.isLoading) return;
    if (hasAttemptedThisSession) return;
    if (state.city) return;

    setHasAttemptedThisSession(true);
    detectCity();
  }, [authLoading, isAuthenticated, state.isLoading, state.city, hasAttemptedThisSession]);

  async function persist(next: Partial<LocationState>) {
    const payload = {
      city: next.city ?? state.city,
      country: next.country ?? state.country,
      latitude: next.latitude ?? state.latitude,
      longitude: next.longitude ?? state.longitude,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  const setCity = async (city: string | null) => {
    setState((prev) => ({ ...prev, city }));
    try {
      await persist({ city });
    } catch {
      // ignore
    }
  };

  const clearLocation = async () => {
    setState({ city: null, country: null, latitude: null, longitude: null, isLoading: false, error: null });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const detectCity = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const perm = await permissionService.requestLocationPermission();
      if (!perm.granted) {
        setState((prev) => ({ ...prev, isLoading: false, error: 'LOCALISATION_REFUSED' }));
        return;
      }

      const loc = await permissionService.getCurrentLocation();
      if (!loc) {
        setState((prev) => ({ ...prev, isLoading: false, error: 'LOCALISATION_UNAVAILABLE' }));
        return;
      }

      const { latitude, longitude } = loc.coords;
      const geos = await Location.reverseGeocodeAsync({ latitude, longitude });
      const first = geos?.[0];

      const city = (first?.city || first?.subregion || first?.region || '').trim() || null;
      const country = (first?.country || '').trim() || null;

      setState({ city, country, latitude, longitude, isLoading: false, error: null });
      await persist({ city, country, latitude, longitude });
    } catch (e: any) {
      setState((prev) => ({ ...prev, isLoading: false, error: e?.message || 'LOCALISATION_ERROR' }));
    }
  };

  const value = useMemo<LocationContextType>(() => ({
    location: state,
    detectCity,
    setCity,
    clearLocation,
  }), [state]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}
