import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { notificationService } from "@/services/notificationService";
import * as Device from 'expo-device';
import LoadingPopup from "@/components/LoadingPopup";

// Désactiver complètement le splash screen natif pour éviter les conflits
// En mode développement Expo Go, le splash screen cause des problèmes
// On utilise uniquement notre LoadingPopup personnalisé

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { colorScheme } = useTheme();
  const [appIsReady, setAppIsReady] = useState(false);

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
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </UserPreferencesProvider>
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
