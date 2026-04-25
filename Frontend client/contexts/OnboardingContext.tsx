import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

type OnboardingData = {
  preferred_services: string[];
  acquisition_source: string | null;
  invite_code: string | null;
};

interface OnboardingContextType {
  isCompleted: boolean;
  isSkipped: boolean;
  isLoading: boolean;
  data: OnboardingData;
  setPreferredServices: (ids: string[]) => Promise<void>;
  setAcquisitionSource: (value: string | null) => Promise<void>;
  setInviteCode: (value: string | null) => Promise<void>;
  complete: () => Promise<void>;
  skip: () => Promise<void>;
  reset: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return ctx;
}

function keyForUser(userId: string) {
  return `onboarding:${userId}`;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [data, setData] = useState<OnboardingData>({ preferred_services: [], acquisition_source: null, invite_code: null });

  const inOnboardingGroup = String((segments as any)?.[0] ?? '') === 'onboarding';

  useEffect(() => {
    (async () => {
      if (authLoading) return;

      if (!isAuthenticated || !user?.id) {
        setIsCompleted(false);
        setIsSkipped(false);
        setData({ preferred_services: [], acquisition_source: null, invite_code: null });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let loaded = false;

        try {
          const remote = await apiService.getOnboarding();
          if (remote.success && remote.data) {
            setIsCompleted(Boolean(remote.data.completed));
            setIsSkipped(Boolean(remote.data.skipped));
            setData({
              preferred_services: Array.isArray(remote.data.preferred_services) ? remote.data.preferred_services : [],
              acquisition_source: typeof (remote.data as any)?.acquisition_source === 'string' ? (remote.data as any).acquisition_source : null,
              invite_code: typeof (remote.data as any)?.invite_code === 'string' ? (remote.data as any).invite_code : null,
            });
            try {
              await AsyncStorage.setItem(keyForUser(user.id), JSON.stringify({
                completed: Boolean(remote.data.completed),
                skipped: Boolean(remote.data.skipped),
                preferred_services: Array.isArray(remote.data.preferred_services) ? remote.data.preferred_services : [],
                acquisition_source: typeof (remote.data as any)?.acquisition_source === 'string' ? (remote.data as any).acquisition_source : null,
                invite_code: typeof (remote.data as any)?.invite_code === 'string' ? (remote.data as any).invite_code : null,
              }));
            } catch {
              // ignore
            }
            loaded = true;
          }
        } catch {
          // ignore and fallback
        }

        if (!loaded) {
          const raw = await AsyncStorage.getItem(keyForUser(user.id));
          if (raw) {
            const parsed = JSON.parse(raw);
            setIsCompleted(Boolean(parsed?.completed));
            setIsSkipped(Boolean(parsed?.skipped));
            setData({
              preferred_services: Array.isArray(parsed?.preferred_services) ? parsed.preferred_services : [],
              acquisition_source: typeof parsed?.acquisition_source === 'string' ? parsed.acquisition_source : null,
              invite_code: typeof parsed?.invite_code === 'string' ? parsed.invite_code : null,
            });
          } else {
            setIsCompleted(false);
            setIsSkipped(false);
            setData({ preferred_services: [], acquisition_source: null, invite_code: null });
          }
        }
      } catch {
        setIsCompleted(false);
        setIsSkipped(false);
        setData({ preferred_services: [], acquisition_source: null, invite_code: null });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [authLoading, isAuthenticated, user?.id]);

  useEffect(() => {
    if (authLoading || isLoading) return;
    if (!isAuthenticated) return;

    if (!isCompleted && !isSkipped && !inOnboardingGroup) {
      router.replace('/onboarding' as any);
    }
  }, [authLoading, isLoading, isAuthenticated, isCompleted, isSkipped, inOnboardingGroup, router]);

  async function persist(next: { completed?: boolean; skipped?: boolean; preferred_services?: string[] }) {
    if (!user?.id) return;
    const payload = {
      completed: next.completed ?? isCompleted,
      skipped: next.skipped ?? isSkipped,
      preferred_services: next.preferred_services ?? data.preferred_services,
      acquisition_source: data.acquisition_source,
      invite_code: data.invite_code,
    };
    await AsyncStorage.setItem(keyForUser(user.id), JSON.stringify(payload));
  }

  const setPreferredServices = async (ids: string[]) => {
    const unique = Array.from(new Set(ids));
    if (
      unique.length === data.preferred_services.length &&
      unique.every((v) => data.preferred_services.includes(v))
    ) {
      return;
    }
    setData((prev) => ({ ...prev, preferred_services: unique }));
    try {
      try {
        await apiService.updateOnboarding({ preferred_services: unique });
      } catch {
        // ignore
      }
      await persist({ preferred_services: unique });
    } catch {
      // ignore
    }
  };

  const setAcquisitionSource = async (value: string | null) => {
    if ((value || null) === (data.acquisition_source || null)) return;
    setData((prev) => ({ ...prev, acquisition_source: value }));
    try {
      try {
        await apiService.updateOnboarding({ acquisition_source: value || '' });
      } catch {
        // ignore
      }
      await persist({});
    } catch {
      // ignore
    }
  };

  const setInviteCode = async (value: string | null) => {
    if ((value || null) === (data.invite_code || null)) return;
    setData((prev) => ({ ...prev, invite_code: value }));
    try {
      try {
        await apiService.updateOnboarding({ invite_code: value || '' });
      } catch {
        // ignore
      }
      await persist({});
    } catch {
      // ignore
    }
  };

  const complete = async () => {
    setIsCompleted(true);
    setIsSkipped(false);
    try {
      try {
        await apiService.updateOnboarding({
          completed: true,
          skipped: false,
          preferred_services: data.preferred_services,
          acquisition_source: data.acquisition_source || '',
          invite_code: data.invite_code || '',
        });
      } catch {
        // ignore
      }
      await persist({ completed: true, skipped: false });
    } catch {
      // ignore
    }
    router.replace('/(tabs)' as any);
  };

  const skip = async () => {
    setIsSkipped(true);
    try {
      try {
        await apiService.updateOnboarding({
          skipped: true,
          preferred_services: data.preferred_services,
          acquisition_source: data.acquisition_source || '',
          invite_code: data.invite_code || '',
        });
      } catch {
        // ignore
      }
      await persist({ skipped: true });
    } catch {
      // ignore
    }
    router.replace('/(tabs)' as any);
  };

  const reset = async () => {
    setIsCompleted(false);
    setIsSkipped(false);
    setData({ preferred_services: [], acquisition_source: null, invite_code: null });
    if (user?.id) {
      try {
        await AsyncStorage.removeItem(keyForUser(user.id));
      } catch {
        // ignore
      }
    }
  };

  const value = useMemo<OnboardingContextType>(() => ({
    isCompleted,
    isSkipped,
    isLoading,
    data,
    setPreferredServices,
    setAcquisitionSource,
    setInviteCode,
    complete,
    skip,
    reset,
  }), [isCompleted, isSkipped, isLoading, data]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
