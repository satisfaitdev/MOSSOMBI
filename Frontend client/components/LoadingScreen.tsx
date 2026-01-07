/**
 * ÉCRAN DE CHARGEMENT - MOSSOMBI
 * Affiché pendant la vérification de l'authentification
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Heading, Body } from '@/components/atoms';

export default function LoadingScreen() {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View style={{
        alignItems: 'center',
        padding: 32,
      }}>
        {/* Logo ou icône de l'app */}
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <Heading style={{ 
            color: 'white', 
            fontSize: 32,
            fontWeight: 'bold' 
          }}>
            M
          </Heading>
        </View>

        {/* Indicateur de chargement */}
        <ActivityIndicator 
          size="large" 
          color="white" 
          style={{ marginBottom: 16 }}
        />

        {/* Texte */}
        <Heading style={{ 
          color: 'white', 
          textAlign: 'center',
          marginBottom: 8 
        }}>
          Mossombi
        </Heading>
        
        <Body style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          textAlign: 'center' 
        }}>
          Vérification de votre connexion...
        </Body>
      </View>
    </LinearGradient>
  );
}
