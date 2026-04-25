import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { DeviceEventEmitter, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Snackbar } from "react-native-paper";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { notificationService } from "@/services/notificationService";
import * as Device from 'expo-device';
import LoadingPopup from "@/components/LoadingPopup";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLiveLocationStreaming } from '@/hooks';

// Désactiver complètement le splash screen natif pour éviter les conflits
// En mode développement Expo Go, le splash screen cause des problèmes
// On utilise uniquement notre LoadingPopup personnalisé

const queryClient = new QueryClient();

function AgentLiveLocationManager() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [courierMode, setCourierMode] = useState<'taxi' | 'courier'>('taxi');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [rawVisible, rawMode] = await Promise.all([
          AsyncStorage.getItem('agent_courier_is_visible'),
          AsyncStorage.getItem('agent_courier_mode'),
        ]);

        if (!mounted) return;
        setIsVisible(rawVisible === '1' || rawVisible === 'true');
        if (rawMode === 'taxi' || rawMode === 'courier') setCourierMode(rawMode);
      } catch {
        // ignore
      }
    })();

    const sub = DeviceEventEmitter.addListener('agent_live_location_settings', (payload: any) => {
      try {
        if (!payload) return;
        if (typeof payload.isVisible === 'boolean') setIsVisible(payload.isVisible);
        if (payload.courierMode === 'taxi' || payload.courierMode === 'courier') setCourierMode(payload.courierMode);
      } catch {
        // ignore
      }
    });

    return () => {
      mounted = false;
      try {
        sub.remove();
      } catch {
        // ignore
      }
    };
  }, []);

  useLiveLocationStreaming({
    enabled: Boolean(!isLoading && isAuthenticated && isVisible),
    service_id: courierMode,
    city: '',
    is_busy: false,
    intervalMs: 2500,
  });

  return null;
}

function RootLayoutNav() {
  const { colorScheme } = useTheme();
  const [appIsReady, setAppIsReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackText, setSnackText] = useState('');

  useEffect(() => {
    let unsubscribe: any = null;

    try {
      const NetInfo = require('@react-native-community/netinfo');
      unsubscribe = NetInfo?.default?.addEventListener?.((state: any) => {
        const offline = state?.isConnected === false;
        setIsOffline(Boolean(offline));
      });
    } catch {
    }

    return () => {
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch {
      }
    };
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('api_cache_hit', () => {
      setSnackText('Données du dernier sync');
      setSnackVisible(true);
    });

    return () => {
      try {
        sub.remove();
      } catch {
      }
    };
  }, []);

  // Initialiser l'app et cacher le splash screen
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialiser les notifications au démarrage (seulement sur device physique)
        if (Device?.isDevice) {
          try {
            const token = await notificationService.initialize();
            if (token) {
              console.log('✅ Service de notifications initialisé avec succès');
            } else {
              console.log('⚠️ Notifications non disponibles (permissions ou device)');
            }
          } catch (error) {
            console.warn('⚠️ Erreur initialisation notifications (normal en dev):', error instanceof Error ? error.message : String(error));
          }
        } else {
          console.log('📱 Notifications désactivées en mode développement (Expo Go)');
        }
        
        // Attendre un peu pour que tout soit initialisé
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Marquer l'app comme prête (pas de splash screen natif)
        setAppIsReady(true);
        
      } catch (error) {
        console.error('Erreur initialisation app:', error);
        // Même en cas d'erreur, marquer l'app comme prête
        setAppIsReady(true);
      }
    };
    
    initializeApp();
  }, []);

  // Attendre que l'app soit prête
  if (!appIsReady) {
    return <LoadingPopup visible={true} />;
  }

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, headerBackTitle: "Retour" }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <Snackbar
          visible={isOffline || snackVisible}
          onDismiss={() => setSnackVisible(false)}
          duration={2500}
          style={{ marginBottom: 8 }}
        >
          {isOffline ? 'Hors ligne — données en cache' : snackText}
        </Snackbar>
      </View>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              <UserPreferencesProvider>
                <LocationProvider>
                  <OnboardingProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <AgentLiveLocationManager />
                      <RootLayoutNav />
                    </GestureHandlerRootView>
                  </OnboardingProvider>
                </LocationProvider>
              </UserPreferencesProvider>
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
