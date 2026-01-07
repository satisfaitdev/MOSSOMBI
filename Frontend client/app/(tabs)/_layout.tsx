import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import LoadingPopup from "@/components/LoadingPopup";
import BottomNav from "@/components/organisms/BottomNav";

export default function CustomTabLayout() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // AuthGuard - Rediriger vers login si non authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Afficher le popup de chargement pendant la vérification
  if (isLoading) {
    return <LoadingPopup visible={true} />;
  }

  // Bloquer l'affichage si non authentifié
  if (!isAuthenticated) {
    return <LoadingPopup visible={true} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Contenu des pages */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { 
            paddingBottom: 0,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="services" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="profile" />
      </Stack>

      {/* Bottom Navigation custom */}
      <BottomNav />
    </View>
  );
}
